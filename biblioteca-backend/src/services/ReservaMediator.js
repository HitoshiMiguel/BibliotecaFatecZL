// src/services/ReservaMediator.js
const { poolSistemaNovo, poolOpenBiblio } = require('../infra/db/mysql/connection');
const UserModel = require('../model/UserModel');
const acervoLegadoService = require('./AcervoLegadoService');

/**
 * ReservaMediator (Mediator)
 *
 * Responsável por mediar a comunicação entre:
 * - Usuário (UserModel)
 * - Livro físico (AcervoLegadoService / OpenBiblio)
 * - Tabela de reservas (dg_reservas no sistema novo)
 */
class ReservaMediator {
  /**
   * Cria uma reserva de livro físico a partir de um ID legado (LEGACY_xxx).
   *
   * @param {object} payload
   * @param {number} payload.usuarioId      ID do usuário logado (sistema novo)
   * @param {string} payload.submissaoId    ID recebido do front (ex: "LEGACY_105")
   * @param {string} payload.dataRetirada   Data em formato "AAAA-MM-DD"
   */
  async criarReserva({ usuarioId, submissaoId, dataRetirada }) {
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

    // 1. Buscar usuário (classe Usuário)
    const usuario = await UserModel.findById(usuarioId);
    if (!usuario) {
      const err = new Error('Usuário não encontrado.');
      err.statusCode = 404;
      throw err;
    }

    // 2. Buscar livro físico no acervo legado (classe Livro)
    const legacyId = String(submissaoId).split('_')[1];
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
      statusLower.startsWith('disponível') || statusLower === 'disponível';

    if (!estaDisponivel) {
      const err = new Error(
        `Livro indisponível para reserva (status atual: ${livro.status || 'desconhecido'}).`
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Criar registro na tabela de reservas (dg_reservas)
    const sqlInsert = `
    INSERT INTO dg_reservas (
        usuario_id,
        legacy_bibid,
        codigo_barras,
        titulo,
        origem,
        data_prevista_retirada,
        data_prevista_devolucao
    )
    VALUES (
        ?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 7 DAY)
    )
    `;
    const paramsInsert = [
      usuarioId,
      legacyId,
      livro.codigo_barras,
      livro.titulo,
      'FISICO',
      dataRetirada, // data_prevista_retirada
      dataRetirada, // usado no DATE_ADD pra calcular devolução
    ];

    const [result] = await poolSistemaNovo.query(sqlInsert, paramsInsert);

    // 4. Atualizar o status do exemplar no OpenBiblio para "hld" (reservado)
    await poolOpenBiblio.query(
      'UPDATE biblio_copy SET status_cd = ? WHERE bibid = ? AND barcode_nmbr = ?',
      ['hld', legacyId, livro.codigo_barras]
    );

    // 5. Retornar um "DTO" da reserva criada
    return {
      reserva_id: result.insertId,
      usuario_id: usuarioId,
      legacy_bibid: Number(legacyId),
      codigo_barras: livro.codigo_barras,
      titulo: livro.titulo,
      origem: 'FISICO',
      status: 'ativa',
      data_prevista_retirada: dataRetirada,
      // NOVO:
      data_prevista_devolucao: null, // ainda não atendida (vamos usar esse campo mais na fase emprestado)
      usuario_nome: usuario.nome,
      usuario_email: usuario.email,
      usuario_ra: usuario.ra,
    };
  }
}

// Exporta UMA instância (padrão Mediator como "central" única)
module.exports = new ReservaMediator();
