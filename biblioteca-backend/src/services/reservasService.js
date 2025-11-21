// src/services/reservasService.js
const {poolSistemaNovo: pool, poolOpenBiblio,} = require('../infra/db/mysql/connection');
const acervoLegadoService = require('./AcervoLegadoService');

const ALLOWED_STATUS = ['ativa', 'atendida', 'cancelada'];

function parseLegacyId(submissaoId) {
  const str = String(submissaoId || '');
  if (!str.startsWith('LEGACY_')) {
    throw new Error('Somente itens físicos (LEGACY_*) podem ser reservados.');
  }
  const partes = str.split('_');
  const idReal = partes[1];
  if (!idReal || isNaN(Number(idReal))) {
    throw new Error('ID legado inválido.');
  }
  return Number(idReal);
}

async function criarReserva(usuarioId, submissaoId, dataPrevistaRetirada) {

  if (!usuarioId) {
    throw new Error('Usuário não informado.');
  }

  if (!dataPrevistaRetirada) {
    throw new Error('Data de retirada é obrigatória.');
  }

  // Validação simples de formato (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPrevistaRetirada)) {
    throw new Error('Formato de data inválido. Use AAAA-MM-DD.');
  }
  const legacyBibid = parseLegacyId(submissaoId);

  // 1. Busca o livro no OpenBiblio para validar
  const livro = await acervoLegadoService.buscarPorId(legacyBibid);
  if (!livro) {
    throw new Error('Item físico não encontrado no acervo.');
  }

  if (livro.status !== 'Disponível') {
    throw new Error(
      `Item não está disponível para reserva (status atual: ${livro.status}).`
    );
  }

  // 2. Verifica se já existe UMA reserva ativa para esse bibid
  const [rowsExistentes] = await pool.query(
    'SELECT reserva_id FROM dg_reservas WHERE legacy_bibid = ? AND status = "ativa" LIMIT 1',
    [legacyBibid]
  );

  if (rowsExistentes.length > 0) {
    throw new Error('Já existe uma reserva ativa para este item.');
  }

  // 3. (Opcional) impede que o MESMO usuário tenha reserva ativa duplicada
  const [rowsUser] = await pool.query(
    'SELECT reserva_id FROM dg_reservas WHERE legacy_bibid = ? AND usuario_id = ? AND status = "ativa" LIMIT 1',
    [legacyBibid, usuarioId]
  );

  if (rowsUser.length > 0) {
    throw new Error('Você já possui uma reserva ativa para este item.');
  }

  // 4. Cria a reserva
  const [result] = await pool.query(
    `INSERT INTO dg_reservas 
      (usuario_id, legacy_bibid, codigo_barras, titulo, status, data_reserva, data_prevista_retirada)
     VALUES (?, ?, ?, ?, 'ativa', NOW(), ?)`,
    [usuarioId, legacyBibid, livro.codigo_barras || null, livro.titulo, dataPrevistaRetirada]
  );

  // 5. Atualiza o status no OpenBiblio para "hld" (reservado)
    try {
    await poolOpenBiblio.query(
        'UPDATE biblio_copy SET status_cd = "hld" WHERE bibid = ?',
        [legacyBibid]
    );
    } catch (err) {
    console.error('Falha ao atualizar status no OpenBiblio:', err.message);
    // não damos throw aqui pra não quebrar a reserva do sistema novo
    }

  return {
    reserva_id: result.insertId,
    usuario_id: usuarioId,
    legacy_bibid: legacyBibid,
    codigo_barras: livro.codigo_barras,
    titulo: livro.titulo,
    status: 'ativa',
    data_prevista_retirada: dataPrevistaRetirada,
  };
}

async function listarPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    `
    SELECT 
      reserva_id,
      usuario_id,
      legacy_bibid,
      codigo_barras,
      titulo,
      status,
      data_reserva,
      data_atendimento,
      origem
    FROM dg_reservas
    WHERE usuario_id = ?
    ORDER BY data_reserva DESC
    `,
    [usuarioId]
  );
  return rows;
}

async function listarTodas() {
  const [rows] = await pool.query(
    `
    SELECT 
      r.*,
      u.nome AS nome_usuario,
      u.email AS email_usuario
    FROM dg_reservas r
    INNER JOIN dg_usuarios u ON u.usuario_id = r.usuario_id
    ORDER BY r.data_reserva DESC
    `
  );
  return rows;
}

async function atualizarStatus(reservaId, novoStatus) {
  if (!ALLOWED_STATUS.includes(novoStatus)) {
    throw new Error('Status de reserva inválido.');
  }

  // 1. Descobre o legacy_bibid da reserva
  const [rows] = await pool.query(
    'SELECT legacy_bibid FROM dg_reservas WHERE reserva_id = ?',
    [reservaId]
  );
  if (rows.length === 0) {
    return 0;
  }
  const legacyBibid = rows[0].legacy_bibid;

  // 2. Decide o novo status no OpenBiblio
  let novoStatusLegado = null;
  if (novoStatus === 'cancelada') {
    novoStatusLegado = 'in'; // Disponível
  } else if (novoStatus === 'atendida') {
    novoStatusLegado = 'out'; // Emprestado
  }

  if (novoStatusLegado) {
    try {
      await poolOpenBiblio.query(
        'UPDATE biblio_copy SET status_cd = ? WHERE bibid = ?',
        [novoStatusLegado, legacyBibid]
      );
    } catch (err) {
      console.error(
        'Falha ao atualizar status no OpenBiblio (atualizarStatus):',
        err.message
      );
      // Não estouramos erro pra não matar o fluxo
    }
  }

  // 3. Atualiza a tabela de reservas
  const campos = ['status = ?'];
  const params = [novoStatus];

  if (novoStatus === 'atendida') {
    campos.push('data_atendimento = NOW()');
  }

  const sql = `
    UPDATE dg_reservas
    SET ${campos.join(', ')}
    WHERE reserva_id = ?
  `;
  params.push(reservaId);

  const [result] = await pool.query(sql, params);
  return result.affectedRows;
}

module.exports = {
  criarReserva,
  listarPorUsuario,
  listarTodas,
  atualizarStatus,
};
