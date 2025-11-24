const cron = require('node-cron');
const { poolSistemaNovo: pool } = require('../../infra/db/mysql/connection');
const { subject } = require('../../services/observers/index');

console.log('[Scheduler] require path:', __filename);

if (global.__RESERVA_NOTIFS_SCHEDULER_LOADED) {
  console.log('[Scheduler] já carregado globalmente — exportando stubs.');
  module.exports = {
    start: () => console.log('[Scheduler] start() chamado, mas scheduler já carregado.'),
    checkDueTodayAndOverdue: async () => ({ due: 0, overdue: 0 }),
  };
  return;
}
global.__RESERVA_NOTIFS_SCHEDULER_LOADED = true;
global.__RESERVA_NOTIFS_CHECK_STARTED = false;

function parseISODateOnly(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
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
  return new Date(d).toISOString().slice(0,10);
}

async function fetchUserEmail(usuario_id) {
  const [rows] = await pool.query('SELECT email FROM dg_usuarios WHERE usuario_id = ?', [usuario_id]);
  return rows[0]?.email || null;
}

async function checkDueTodayAndOverdue() {
  if (global.__RESERVA_NOTIFS_CHECK_STARTED) return { due: 0, overdue: 0 };
  global.__RESERVA_NOTIFS_CHECK_STARTED = true;

  try {
    console.log('[Scheduler] checkDueTodayAndOverdue: início', new Date().toISOString());
    const hojeISO = formatDateISO(new Date());

    // reservas vencendo hoje
    const [dueRows] = await pool.query(
      `SELECT reserva_id, usuario_id, titulo, codigo_barras, data_prevista_devolucao, legacy_bibid
       FROM dg_reservas
       WHERE status = 'atendida'
         AND DATE(data_prevista_devolucao) = ?`,
      [hojeISO]
    );

    for (const r of dueRows) {
      const email = await fetchUserEmail(r.usuario_id);
      if (!email) continue;

      const eventKey = `devolucao_hoje_reserva_${r.reserva_id}_user_${r.usuario_id}`;
      await subject.notify({
        type: 'lembrar_devolucao_hoje',
        payload: {
          reserva_id: r.reserva_id,
          usuario_id: r.usuario_id,
          titulo: r.titulo,
          codigo_barras: r.codigo_barras,
          legacy_bibid: r.legacy_bibid,
          linkConsulta: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consulta/LEGACY_${r.legacy_bibid}`,
          usuario_email: email,
          eventKey
        }
      });
    }

    // reservas atrasadas
    const [overRows] = await pool.query(
      `SELECT reserva_id, usuario_id, titulo, codigo_barras, data_prevista_devolucao, legacy_bibid
       FROM dg_reservas
       WHERE status = 'atendida'
         AND DATE(data_prevista_devolucao) < ?`,
      [hojeISO]
    );

    for (const r of overRows) {
      const email = await fetchUserEmail(r.usuario_id);
      if (!email) continue;

      const devol = parseISODateOnly(r.data_prevista_devolucao) || new Date(r.data_prevista_devolucao);
      const hoje = startOfDay(new Date());
      const diffDays = Math.round((hoje - startOfDay(devol)) / (1000*60*60*24));

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
          usuario_email: email,
          eventKey
        }
      });
    }

    console.log(`[Scheduler] checkDueTodayAndOverdue: done. due:${dueRows.length} overdue:${overRows.length}`);
    return { due: dueRows.length, overdue: overRows.length };

  } catch (err) {
    console.error('[Scheduler] erro ao checar devoluções:', err);
    throw err;
  }
}

function start() {
  if (global.__RESERVA_NOTIFS_SCHEDULER_STARTED) return;
  global.__RESERVA_NOTIFS_SCHEDULER_STARTED = true;

  checkDueTodayAndOverdue().catch(e => console.error('[Scheduler] check inicial falhou:', e));

  cron.schedule('0 8 * * *', () => {
    console.log('[Scheduler] Cron disparado: verificando devoluções', new Date().toISOString());
    checkDueTodayAndOverdue().catch(e => console.error('[Scheduler] erro no cron:', e));
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });
}

module.exports = { start, checkDueTodayAndOverdue };
