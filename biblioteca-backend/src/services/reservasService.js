// src/services/reservasService.js
const { poolSistemaNovo: pool, poolOpenBiblio } = require('../infra/db/mysql/connection');
const acervoLegadoService = require('./AcervoLegadoService');
const { subject } = require('./observers'); // design pattern observer

// serviço para checar bloqueio do usuário
const { isUserBlocked } = require('./userBlockService');

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

/**
 * criarReserva
 * - verifica bloqueio do usuário (usando isUserBlocked)
 * - valida dados
 * - cria reserva em dg_reservas
 * - atualiza OpenBiblio para hld (reservado)
 */
async function criarReserva(usuarioId, submissaoId, dataPrevistaRetirada) {
  if (!usuarioId) {
    throw new Error('Usuário não informado.');
  }

  // 0) bloquear usuários que estão no estado "bloqueado"
  const blockedInfo = await isUserBlocked(usuarioId);
  if (blockedInfo.blocked) {
    const until = blockedInfo.bloqueadoAte ? blockedInfo.bloqueadoAte.toISOString().slice(0,10) : 'indefinido';
    const err = new Error(`Conta temporariamente bloqueada até ${until}. Procure a biblioteca.`);
    err.statusCode = 403;
    throw err;
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

  if (typeof livro.status === 'string' && !String(livro.status).toLowerCase().startsWith('dispon')) {
    // se status não começar com "dispon" consideramos indisponível; isso lida com variações "Disponível", "disponível", etc.
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

  // 5. Atualiza o status no OpenBiblio para "hld" (reservado) - não estoura erro se falhar
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
      data_prevista_retirada,
      data_prevista_devolucao,
      renovacoes,
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
    // marca atendimento e define data prevista de devolução para 7 dias a partir do momento do atendimento
    campos.push('data_atendimento = NOW()');
    campos.push('data_prevista_devolucao = DATE_ADD(NOW(), INTERVAL 7 DAY)');
  }

  // 4. alertas
  if (novoStatus === 'atendida') { 
    // reserva transformou-se em empréstimo ativo — notificar usuário (confirmação)
    try {
      // recupera dados básicos para payload (titulo, usuário, email)
      const [rowsMeta] = await pool.query(
        `SELECT r.reserva_id, r.legacy_bibid, r.titulo, r.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email 
        FROM dg_reservas r
        LEFT JOIN dg_usuarios u ON u.usuario_id = r.usuario_id
        WHERE r.reserva_id = ? LIMIT 1`, [reservaId]
      );
      const meta = rowsMeta[0];
      await subject.notify({
        type: 'reserva_atendida',
        payload: {
          reserva_id: reservaId,
          titulo: meta?.titulo,
          usuario_id: meta?.usuario_id,
          usuario_nome: meta?.usuario_nome,
          usuario_email: meta?.usuario_email,
          eventKey: `reserva_atendida_${reservaId}`
        }
      });
    } catch (err) {
      console.warn('[reservasService] erro ao notificar atendimento', err.message);
    }
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

/**
 * Renova uma reserva (usuário dono):
 * - só permite renovar quando status = 'atendida' (empréstimo ativo)
 * - bloqueia se estiver atrasado
 * - permite até MAX_RENEW renovações
 * - incrementa contador 'renovacoes' e estende data_prevista_devolucao em +7 dias
 */
async function renovarReserva(reservaId, usuarioId) {
  const MAX_RENEW = 2; // sugestão: 2 renovações máximas

  if (!reservaId || !usuarioId) {
    const e = new Error('Reserva ou usuário inválido.');
    e.statusCode = 400;
    throw e;
  }

  // buscar reserva
  const [rows] = await pool.query(
    `SELECT reserva_id, usuario_id, status, data_prevista_devolucao, data_prevista_retirada, renovacoes
     FROM dg_reservas WHERE reserva_id = ? LIMIT 1`,
    [reservaId]
  );

  if (rows.length === 0) {
    const e = new Error('Reserva não encontrada.');
    e.statusCode = 404;
    throw e;
  }
  const reserva = rows[0];

  // propriedade
  if (reserva.usuario_id !== usuarioId) {
    const e = new Error('Você não tem permissão para renovar esta reserva.');
    e.statusCode = 403;
    throw e;
  }

  // apenas se estiver atendida (empréstimo ativo)
  if (reserva.status !== 'atendida') {
    const e = new Error('Só é possível renovar reservas já atendidas (empréstimo ativo).');
    e.statusCode = 400;
    throw e;
  }

  // bloqueia se já estiver atrasado
  if (reserva.data_prevista_devolucao) {
    const hoje = new Date();
    const dv = new Date(reserva.data_prevista_devolucao);
    if (hoje > dv) {
      const e = new Error('Não é possível renovar: empréstimo já está em atraso. Procure a biblioteca.');
      e.statusCode = 400;
      throw e;
    }
  }

  // limite de renovações
  if ((reserva.renovacoes || 0) >= MAX_RENEW) {
    const e = new Error(`Limite de renovações atingido (máx. ${MAX_RENEW}).`);
    e.statusCode = 400;
    throw e;
  }

  // atualiza: incrementa renovacoes e soma 7 dias na data_prevista_devolucao
  const sqlUpdate = `
    UPDATE dg_reservas SET
      data_prevista_devolucao = DATE_ADD(
        COALESCE(data_prevista_devolucao, DATE_ADD(data_prevista_retirada, INTERVAL 7 DAY)),
        INTERVAL 7 DAY
      ),
      renovacoes = renovacoes + 1
    WHERE reserva_id = ?
  `;
  const [resUpdate] = await pool.query(sqlUpdate, [reservaId]);
  if (resUpdate.affectedRows === 0) {
    const e = new Error('Falha ao renovar reserva.');
    e.statusCode = 500;
    throw e;
  }

  // busca nova data
  const [rows2] = await pool.query(
    `SELECT data_prevista_devolucao, renovacoes FROM dg_reservas WHERE reserva_id = ? LIMIT 1`,
    [reservaId]
  );

  return {
    reservaId,
    novaDataDevolucao: rows2[0]?.data_prevista_devolucao ?? null,
    renovacoes: rows2[0]?.renovacoes ?? null
  };
}

const buscarEmprestimoAtivoPorUsuario = async (usuarioId) => {
  const sql = `
    SELECT 
      titulo, 
      data_prevista_devolucao, 
      data_prevista_retirada,
      status 
    FROM dg_reservas 
    WHERE usuario_id = ? 
    AND status IN ('ativa', 'atendida')
    ORDER BY data_reserva DESC 
    LIMIT 1
  `;

  const [rows] = await pool.execute(sql, [usuarioId]);
  return rows[0];
};

module.exports = {
  criarReserva,
  listarPorUsuario,
  listarTodas,
  atualizarStatus,
  buscarEmprestimoAtivoPorUsuario,
  renovarReserva,
};
