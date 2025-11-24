// src/services/schedulers/reservaNotificationsScheduler.js
const cron = require('node-cron');
const { poolSistemaNovo: pool } = require('../../infra/db/mysql/connection');
const { subject } = require('../../services/observers/index'); // seu subject já instanciado

console.log('[Scheduler] require path:', __filename);

// Proteção para evitar double-loading (hot-reload / requires duplicados)
if (global.__RESERVA_NOTIFS_SCHEDULER_LOADED) {
  console.log('[Scheduler] já carregado globalmente — exportando stubs.');
  module.exports = {
    start: () => console.log('[Scheduler] start() chamado, mas scheduler já carregado.'),
    checkDueTodayAndOverdue: async () => {
      console.log('[Scheduler] checkDueTodayAndOverdue() stub chamado - scheduler carregado em outro lugar.');
      return { due: 0, overdue: 0 };
    },
  };
  return;
}
global.__RESERVA_NOTIFS_SCHEDULER_LOADED = true;

// --------------------------------------------------
// Helpers de data (seguros e sem dependência externa)
// --------------------------------------------------
function parseISODateOnly(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10); // YYYY-MM-DD
  const parts = s.split('-').map(Number);
  if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }
  const fallback = new Date(v);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function startOfDay(d) {
  const dt = new Date(d);
  dt.setHours(0,0,0,0);
  return dt;
}

function formatDateISO(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0,10);
}

function formatDateBR(v) {
  const d = parseISODateOnly(v);
  if (!d) return '-';
  return d.toLocaleDateString('pt-BR');
}

// --------------------------------------------------
// Função que faz a verificação (pode ser chamada para testes)
// --------------------------------------------------
async function checkDueTodayAndOverdue() {
  try {
    console.log('[Scheduler] checkDueTodayAndOverdue: início', new Date().toISOString());

    const hojeISO = formatDateISO(new Date());

    // 1) reservas que vencem HOJE e estão 'atendida'
    const [dueRows] = await pool.query(
      `SELECT reserva_id, usuario_id, titulo, codigo_barras, data_prevista_devolucao, legacy_bibid
       FROM dg_reservas
       WHERE status = 'atendida'
         AND DATE(data_prevista_devolucao) = ?`,
      [hojeISO]
    );

    let dueCount = 0;
    if (Array.isArray(dueRows) && dueRows.length > 0) {
      dueCount = dueRows.length;
      for (const r of dueRows) {
        const eventKey = `devolucao_hoje_reserva_${r.reserva_id}_user_${r.usuario_id}`;
        try {
          await subject.notify({
            type: 'lembrar_devolucao_hoje',
            payload: {
              reserva_id: r.reserva_id,
              usuario_id: r.usuario_id,
              titulo: r.titulo,
              codigo_barras: r.codigo_barras,
              legacy_bibid: r.legacy_bibid,
              linkConsulta: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consulta/LEGACY_${r.legacy_bibid}`,
              eventKey
            }
          });
        } catch (innerErr) {
          console.error('[Scheduler] erro ao notificar lembrete de devolução hoje para reserva', r.reserva_id, innerErr);
        }
      }
    }

    // 2) reservas com devolução anterior (atrasadas)
    const [overRows] = await pool.query(
      `SELECT reserva_id, usuario_id, titulo, codigo_barras, data_prevista_devolucao, legacy_bibid
       FROM dg_reservas
       WHERE status = 'atendida'
         AND DATE(data_prevista_devolucao) < ?`,
      [hojeISO]
    );

    let overdueCount = 0;
    if (Array.isArray(overRows) && overRows.length > 0) {
      overdueCount = overRows.length;
      for (const r of overRows) {
        try {
          // calcula dias de atraso com segurança
          const devol = parseISODateOnly(r.data_prevista_devolucao) || new Date(r.data_prevista_devolucao);
          const hoje = startOfDay(new Date());
          const devolDay = startOfDay(devol);
          const diffDays = Math.round((hoje - devolDay) / (1000*60*60*24));
          const eventKey = `devolucao_atrasada_reserva_${r.reserva_id}_user_${r.usuario_id}`;

          await subject.notify({
            type: 'reserva_atrasada',
            payload: {
              reserva_id: r.reserva_id,
              usuario_id: r.usuario_id,
              titulo: r.titulo,
              codigo_barras: r.codigo_barras,
              dias_atraso: diffDays,
              legacy_bibid: r.legacy_bibid,
              linkConsulta: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consulta/LEGACY_${r.legacy_bibid}`,
              eventKey
            }
          });
        } catch (innerErr) {
          console.error('[Scheduler] erro ao notificar atraso para reserva', r.reserva_id, innerErr);
        }
      }
    }

    console.log(`[Scheduler] checkDueTodayAndOverdue: done. due:${dueCount} overdue:${overdueCount}`);
    return { due: dueCount, overdue: overdueCount };
  } catch (err) {
    console.error('[Scheduler] erro ao checar devoluções:', err);
    throw err;
  }
}

// --------------------------------------------------
// start() — garante que só inicia 1 vez e seta flag ANTES de chamar check
// --------------------------------------------------
function start() {
  if (global.__RESERVA_NOTIFS_SCHEDULER_STARTED) {
    console.log('[Scheduler] start() ignorado — já iniciado anteriormente.');
    return;
  }
  // marca iniciado rapidamente para prevenir race conditions / double-start
  global.__RESERVA_NOTIFS_SCHEDULER_STARTED = true;

  console.log('[Scheduler] iniciando reservaNotificationsScheduler (guardado).');

  // Executa uma vez ao iniciar (try/catch para evitar crash)
  checkDueTodayAndOverdue().catch(e => console.error('[Scheduler] check inicial falhou:', e));

  // Cron diário às 08:00
  cron.schedule('0 8 * * *', () => {
    console.log('[Scheduler] Cron disparado: verificando devoluções', new Date().toISOString());
    checkDueTodayAndOverdue().catch(e => console.error('[Scheduler] erro no cron:', e));
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  console.log('[Scheduler] reservaNotificationsScheduler iniciado (rotina diária às 08:00).');
}

// export
module.exports = { start, checkDueTodayAndOverdue };
