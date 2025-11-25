// src/services/ReservaMediator.js
const { poolSistemaNovo, poolOpenBiblio } = require('../infra/db/mysql/connection');
const UserModel = require('../model/UserModel');
const acervoLegadoService = require('./AcervoLegadoService');
const { isUserBlocked } = require('./userBlockService');

/**
 * ReservaMediator
 *
 * Responsável por orquestrar Usuário + Livro (OpenBiblio) + criação de reserva no sistema novo.
 * Exporta UMA instância (singleton).
 */
class ReservaMediator {
  constructor() {}

  _parseLegacyId(submissaoId) {
    const str = String(submissaoId || '');
    if (!str.startsWith('LEGACY_')) {
      const e = new Error('Somente itens físicos (LEGACY_) podem ser reservados.');
      e.statusCode = 400;
      throw e;
    }
    const partes = str.split('_');
    const idReal = partes[1];
    if (!idReal || isNaN(Number(idReal))) {
      const e = new Error('ID legado inválido.');
      e.statusCode = 400;
      throw e;
    }
    return Number(idReal);
  }

  /**
   * criarReserva
   * @param {object} payload
   * @param {number} payload.usuarioId
   * @param {string} payload.submissaoId (ex: "LEGACY_105")
   * @param {string} payload.dataRetirada (AAAA-MM-DD)
   */
  async criarReserva({ usuarioId, submissaoId, dataRetirada }) {
    // validações básicas de entrada
    if (!usuarioId) {
      const err = new Error('Usuário não informado para a reserva.');
      err.statusCode = 401;
      throw err;
    }
    if (!submissaoId || !String(submissaoId).startsWith('LEGACY_')) {
      const err = new Error('Somente itens físicos (LEGACY_) podem ser reservados.');
      err.statusCode = 400;
      throw err;
    }
    if (!dataRetirada) {
      const err = new Error('Data de retirada é obrigatória.');
      err.statusCode = 400;
      throw err;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataRetirada))) {
      const err = new Error('Formato de data inválido. Use AAAA-MM-DD.');
      err.statusCode = 400;
      throw err;
    }

    // 1) Verificar bloqueio do usuário (regra de negócio: bloqueado não pode reservar)
    const blockedInfo = await isUserBlocked(usuarioId);
    if (blockedInfo.blocked) {
      const until = blockedInfo.bloqueadoAte ? blockedInfo.bloqueadoAte.toISOString().slice(0,10) : 'indefinido';
      const err = new Error(`Conta temporariamente bloqueada até ${until}. Procure a biblioteca.`);
      err.statusCode = 403;
      throw err;
    }

    // 2) Buscar usuário (classe UserModel)
    const usuario = await UserModel.findById(usuarioId);
    if (!usuario) {
      const err = new Error('Usuário não encontrado.');
      err.statusCode = 404;
      throw err;
    }

    // 3) Buscar livro físico no acervo legado (OpenBiblio)
    const legacyId = this._parseLegacyId(submissaoId);
    const livro = await acervoLegadoService.buscarPorId(legacyId);
    if (!livro) {
      const err = new Error('Livro físico não encontrado no acervo.');
      err.statusCode = 404;
      throw err;
    }

    if (!livro.codigo_barras) {
      const err = new Error('Livro não possui código de barras válido para reserva.');
      err.statusCode = 400;
      throw err;
    }

    // Validação básica de status: só permite reservar se estiver disponível
    const statusLower = String(livro.status || '').toLowerCase();
    const estaDisponivel =
      statusLower.startsWith('dispon') || statusLower === 'disponível' || statusLower === 'disponivel';

    if (!estaDisponivel) {
      const err = new Error(
        `Livro indisponível para reserva (status atual: ${livro.status || 'desconhecido'}).`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4) Evitar duplicidade: já existe reserva ativa para o mesmo bibid?
    const [existRows] = await poolSistemaNovo.query(
      'SELECT reserva_id FROM dg_reservas WHERE legacy_bibid = ? AND status = "ativa" LIMIT 1',
      [legacyId]
    );
    if (existRows && existRows.length > 0) {
      const e = new Error('Já existe uma reserva ativa para este item.');
      e.statusCode = 409;
      throw e;
    }

    // 5) Evitar que o mesmo usuário tenha reserva ativa duplicada para o mesmo item
    const [userRows] = await poolSistemaNovo.query(
      'SELECT reserva_id FROM dg_reservas WHERE legacy_bibid = ? AND usuario_id = ? AND status = "ativa" LIMIT 1',
      [legacyId, usuarioId]
    );
    if (userRows && userRows.length > 0) {
      const e = new Error('Você já possui uma reserva ativa para este item.');
      e.statusCode = 409;
      throw e;
    }

    // 6) Inserir reserva no sistema novo
    const sqlInsert = `
    INSERT INTO dg_reservas (
        usuario_id,
        legacy_bibid,
        codigo_barras,
        titulo,
        origem,
        data_prevista_retirada,
        data_prevista_devolucao,
        status,
        data_reserva
    )
    VALUES (?, ?, ?, ?, ?, ?, NULL, 'ativa', NOW())
    `;
    const paramsInsert = [
      usuarioId,
      legacyId,
      livro.codigo_barras,
      livro.titulo,
      'FISICO',
      dataRetirada // data_prevista_retirada
    ];

    const [result] = await poolSistemaNovo.query(sqlInsert, paramsInsert);

    // 7) Tentar marcar exemplar no OpenBiblio como "hld" (reservado) - não fatal se falhar
    try {
      await poolOpenBiblio.query(
        'UPDATE biblio_copy SET status_cd = ? WHERE bibid = ? AND barcode_nmbr = ?',
        ['hld', legacyId, livro.codigo_barras]
      );
    } catch (err) {
      console.warn('ReservaMediator: falha ao atualizar OpenBiblio (não crítico):', err.message);
    }

    // 8) Retornar DTO da reserva criada
    return {
      reserva_id: result.insertId,
      usuario_id: usuarioId,
      legacy_bibid: Number(legacyId),
      codigo_barras: livro.codigo_barras,
      titulo: livro.titulo,
      origem: 'FISICO',
      status: 'ativa',
      data_prevista_retirada: dataRetirada,
      data_prevista_devolucao: null,
      usuario_nome: usuario.nome,
      usuario_email: usuario.email,
      usuario_ra: usuario.ra
    };
  } // criarReserva
} // class

module.exports = new ReservaMediator();
