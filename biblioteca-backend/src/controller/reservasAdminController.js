// src/controller/reservasAdminController.js
const {
  poolSistemaNovo,
  poolOpenBiblio
} = require('../infra/db/mysql/connection');

const { blockUserForDays, isUserBlocked } = require('../services/userBlockService');
const { subject } = require('../services/observers');

/**
 * Helper local
 */
function startOfDay(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0,0,0,0);
  return dt;
}

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
    try {
      await poolOpenBiblio.query(
        'UPDATE biblio_copy SET status_cd = ? WHERE bibid = ? AND barcode_nmbr = ?',
        [atualizarOpenBiblioPara, reserva.legacy_bibid, reserva.codigo_barras]
      );
    } catch (err) {
      console.error(
        'Falha ao atualizar status no OpenBiblio (atualizarStatus):',
        err.message
      );
      // Não estouramos erro pra não matar o fluxo
    }
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
 *
 * Nota: verifica bloqueio DO USUÁRIO antes de atender.
 */
const atenderReserva = async (req, res) => {
  try {
    const { id } = req.params;

    // 0) buscar reserva para ter usuario_id antes de atualizar
    const [rowsReserva] = await poolSistemaNovo.query(
      'SELECT reserva_id, usuario_id FROM dg_reservas WHERE reserva_id = ? LIMIT 1',
      [id]
    );
    if (!rowsReserva || rowsReserva.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }
    const reservaRow = rowsReserva[0];

    // 1) verificar bloqueio do usuário
    const blocked = await isUserBlocked(reservaRow.usuario_id);
    if (blocked.blocked) {
      return res.status(400).json({ message: `Usuário bloqueado até ${blocked.bloqueadoAte.toISOString().slice(0,10)}.`});
    }

    // 2) atualiza status para atendida e atualiza OpenBiblio
    const reservaAtualizada = await atualizarStatusReserva(id, 'atendida', {
      atualizarOpenBiblioPara: 'out',
    });

    // 3) notificar (opcional: subject.notify para reserva_atendida)
    try {
      const [rowsMeta] = await poolSistemaNovo.query(
        `SELECT r.reserva_id, r.legacy_bibid, r.titulo, r.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email 
         FROM dg_reservas r
         LEFT JOIN dg_usuarios u ON u.usuario_id = r.usuario_id
         WHERE r.reserva_id = ? LIMIT 1`, [id]
      );
      const meta = rowsMeta[0];
      if (meta) {
        await subject.notify({
          type: 'reserva_atendida',
          payload: {
            reserva_id: id,
            titulo: meta?.titulo,
            usuario_id: meta?.usuario_id,
            usuario_nome: meta?.usuario_nome,
            usuario_email: meta?.usuario_email,
            eventKey: `reserva_atendida_${id}`
          }
        });
      }
    } catch (err) {
      console.warn('[ReservasAdminController] erro ao notificar atendimento (não crítico):', err.message);
    }

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
 * Aplica bloqueio ao usuário por dias_atraso (se houver).
 */
const concluirReserva = async (req, res) => {
  try {
    const { id } = req.params;

    // atualiza status (sua função existente)
    const reservaAtualizada = await atualizarStatusReserva(id, 'concluida', {
      atualizarOpenBiblioPara: 'in',
    });

    // 1) tenta obter legacy_bibid e titulo direto da resposta da atualização
    let legacyId = reservaAtualizada?.legacy_bibid ?? reservaAtualizada?.legacyBibid ?? null;
    let tituloDoLivro =
      reservaAtualizada?.titulo ??
      reservaAtualizada?.titulo_proposto ??
      reservaAtualizada?.title ??
      null;

    // 2) calcular dias de atraso e aplicar bloqueio (se houver)
    let diasAtraso = 0;
    try {
      // buscar a reserva atualizada para garantir que temos a data_prevista_devolucao
      const [rowsReserva] = await poolSistemaNovo.query(
        'SELECT data_prevista_devolucao, usuario_id FROM dg_reservas WHERE reserva_id = ? LIMIT 1',
        [id]
      );
      if (rowsReserva.length) {
        const r = rowsReserva[0];
        if (r.data_prevista_devolucao) {
          const dataPrev = new Date(r.data_prevista_devolucao);
          const hoje = startOfDay(new Date());
          // calcular dias inteiros (floor)
          const diffMs = hoje - startOfDay(dataPrev);
          diasAtraso = Math.max(0, Math.round(diffMs / (1000*60*60*24)));
        }
        if (diasAtraso > 0) {
          await blockUserForDays(r.usuario_id, diasAtraso);
          console.log(`[ReservasAdminController] Usuario ${r.usuario_id} bloqueado por ${diasAtraso} dia(s) por atraso.`);
          // opcional: notificar usuário do bloqueio via subject.notify/email
        }
      }
    } catch (err) {
      console.warn('[ReservasAdminController] falha ao calcular/aplicar bloqueio:', err.message);
    }

    // 3) se não tiver legacyId/titulo, busca no DB (fallback seguro)
    if (!legacyId || !tituloDoLivro) {
      const [rows] = await poolSistemaNovo.query(
        'SELECT legacy_bibid, titulo FROM dg_reservas WHERE reserva_id = ? LIMIT 1',
        [id]
      );
      if (rows.length > 0) {
        legacyId = legacyId ?? rows[0].legacy_bibid;
        tituloDoLivro = tituloDoLivro ?? rows[0].titulo;
      }
    }

    // validações finais
    if (!legacyId) {
      const err = new Error('Legacy bibid (legacy_bibid) não encontrado para esta reserva.');
      err.statusCode = 500;
      throw err;
    }
    tituloDoLivro = tituloDoLivro ?? `LEGACY_${legacyId}`;

    // 4) pega usuários que favoritaram esse item (procura pelo campo de submissao_id ou legacy_bibid)
    const [favoritosRows] = await poolSistemaNovo.query(
      `SELECT f.usuario_id, u.email, u.nome
        FROM dg_favoritos f
        JOIN dg_usuarios u ON u.usuario_id = f.usuario_id
        WHERE f.id_legado = ?`,
      [legacyId]
    );

    for (const fav of favoritosRows) {
      // subject.notify deve existir / ter sido instanciado antes; mantive payload compatível
      await subject.notify({
        type: 'livro_disponivel',
        payload: {
          legacy_bibid: legacyId,
          titulo: tituloDoLivro,
          autor: "Nome do autor se disponível",
          editora: "Editora se disponível",
          usuario_id: fav.usuario_id,
          usuario_nome: fav.nome,
          usuario_email: fav.email,
          linkConsulta: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consulta/LEGACY_${legacyId}`,
          eventKey: `livro_disponivel_bibid_${legacyId}_user_${fav.usuario_id}`
        }
      });
    }

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

    // bloqueia se usuário estiver bloqueado
    const blockedInfo = await isUserBlocked(reserva.usuario_id);
    if (blockedInfo.blocked) {
      return res.status(403).json({
        message: `Não é possível renovar: conta do usuário bloqueada até ${blockedInfo.bloqueadoAte.toISOString().slice(0,10)}.`
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
