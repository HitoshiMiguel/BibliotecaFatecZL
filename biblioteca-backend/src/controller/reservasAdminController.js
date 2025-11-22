// src/controller/reservasAdminController.js
const {
  poolSistemaNovo,
  poolOpenBiblio,
} = require('../infra/db/mysql/connection');

/**
 * GET /api/admin/reservas
 * Lista todas as reservas com dados do usuário.
 */
const listarReservas = async (req, res) => {
  try {
    const [rows] = await poolSistemaNovo.query(
      `
      SELECT 
        r.reserva_id,
        r.usuario_id,
        r.legacy_bibid,
        r.codigo_barras,
        r.titulo,
        r.status,
        r.data_reserva,
        r.data_atendimento,
        r.data_prevista_retirada,
        r.data_prevista_devolucao,
        r.origem,
        u.nome       AS usuario_nome,
        u.email      AS usuario_email,
        u.ra         AS usuario_ra
      FROM dg_reservas r
      JOIN dg_usuarios u ON u.usuario_id = r.usuario_id
      ORDER BY r.data_reserva DESC
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error('[ReservasAdminController] ERRO listarReservas:', err);
    return res
      .status(500)
      .json({ message: 'Falha ao listar reservas. Tente novamente.' });
  }
};

/**
 * Helper para atualizar status da reserva e, opcionalmente,
 * o status do exemplar no OpenBiblio.
 */
async function atualizarStatusReserva(reservaId, novoStatus, options = {}) {
  const { atualizarOpenBiblioPara } = options;

  // 1. Busca a reserva no nosso banco
  const [rows] = await poolSistemaNovo.query(
    'SELECT * FROM dg_reservas WHERE reserva_id = ?',
    [reservaId]
  );

  if (!rows || rows.length === 0) {
    const error = new Error('Reserva não encontrada.');
    error.statusCode = 404;
    throw error;
  }

  const reserva = rows[0];

  // 2. Atualiza status + data_atendimento
  const agora = new Date();
  await poolSistemaNovo.query(
    'UPDATE dg_reservas SET status = ?, data_atendimento = ? WHERE reserva_id = ?',
    [novoStatus, agora, reservaId]
  );

  // 3. Atualiza o status do exemplar no OpenBiblio, se solicitado
  if (
    atualizarOpenBiblioPara &&
    reserva.legacy_bibid &&
    reserva.codigo_barras
  ) {
    await poolOpenBiblio.query(
      'UPDATE biblio_copy SET status_cd = ? WHERE bibid = ? AND barcode_nmbr = ?',
      [atualizarOpenBiblioPara, reserva.legacy_bibid, reserva.codigo_barras]
    );
  }

  // Retorna a reserva "atualizada" (objeto merged)
  return {
    ...reserva,
    status: novoStatus,
    data_atendimento: agora,
  };
}

/**
 * POST /api/admin/reservas/:id/atender
 * Marca a reserva como atendida (usuário apareceu e pegou o livro).
 * Atualiza o OpenBiblio para status "out".
 */
const atenderReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reservaAtualizada = await atualizarStatusReserva(id, 'atendida', {
      // No OpenBiblio: "out" = emprestado
      atualizarOpenBiblioPara: 'out',
    });

    return res.json({
      message: 'Reserva marcada como atendida.',
      reserva: reservaAtualizada,
    });
  } catch (err) {
    console.error('[ReservasAdminController] ERRO atenderReserva:', err);
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || 'Falha ao atender reserva.' });
  }
};

/**
 * POST /api/admin/reservas/:id/cancelar
 * Cancela a reserva (erro ou usuário desistiu).
 * Atualiza o OpenBiblio para status "in".
 */
const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reservaAtualizada = await atualizarStatusReserva(id, 'cancelada', {
      // No OpenBiblio: "in" = disponível
      atualizarOpenBiblioPara: 'in',
    });

    return res.json({
      message: 'Reserva cancelada com sucesso.',
      reserva: reservaAtualizada,
    });
  } catch (err) {
    console.error('[ReservasAdminController] ERRO cancelarReserva:', err);
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || 'Falha ao cancelar reserva.' });
  }
};

/**
 * POST /api/admin/reservas/:id/concluir
 * Conclui a reserva (empréstimo encerrado / livro devolvido).
 * Atualiza o OpenBiblio para status "in".
 */
const concluirReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reservaAtualizada = await atualizarStatusReserva(id, 'concluida', {
      atualizarOpenBiblioPara: 'in',
    });

    return res.json({
      message: 'Reserva concluída (devolução registrada).',
      reserva: reservaAtualizada,
    });
  } catch (err) {
    console.error('[ReservasAdminController] ERRO concluirReserva:', err);
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || 'Falha ao concluir reserva.' });
  }
};

/**
 * POST /api/admin/reservas/:id/renovar
 * Renova o empréstimo (extende a data de devolução em +7 dias).
 * Não altera o status (permanece "atendida").
 */
const renovarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca a reserva atual
    const [rows] = await poolSistemaNovo.query(
      'SELECT * FROM dg_reservas WHERE reserva_id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    const reserva = rows[0];

    if (reserva.status !== 'atendida') {
      return res.status(400).json({
        message: 'Somente reservas em estado "atendida" podem ser renovadas.',
      });
    }

    // Se ainda não tiver data_prevista_devolucao, calcula a partir da retirada
    if (!reserva.data_prevista_devolucao && reserva.data_prevista_retirada) {
      await poolSistemaNovo.query(
        `
        UPDATE dg_reservas
        SET data_prevista_devolucao = DATE_ADD(data_prevista_retirada, INTERVAL 7 DAY)
        WHERE reserva_id = ?
        `,
        [id]
      );
    }

    // Agora empurra a data_prevista_devolucao em +7 dias
    await poolSistemaNovo.query(
      `
      UPDATE dg_reservas
      SET data_prevista_devolucao = DATE_ADD(data_prevista_devolucao, INTERVAL 7 DAY)
      WHERE reserva_id = ?
      `,
      [id]
    );

    // Busca novamente para devolver a versão atualizada
    const [rowsAtualizadas] = await poolSistemaNovo.query(
      'SELECT * FROM dg_reservas WHERE reserva_id = ?',
      [id]
    );

    const reservaAtualizada = rowsAtualizadas[0];

    return res.json({
      message: 'Reserva renovada com sucesso. Nova data de devolução aplicada.',
      reserva: reservaAtualizada,
    });
  } catch (err) {
    console.error('[ReservasAdminController] ERRO renovarReserva:', err);
    return res
      .status(500)
      .json({ message: 'Falha ao renovar reserva.' });
  }
};

module.exports = {
  listarReservas,
  atenderReserva,
  cancelarReserva,
  concluirReserva,
  renovarReserva,
};
