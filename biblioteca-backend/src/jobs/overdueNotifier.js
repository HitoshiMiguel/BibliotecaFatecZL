const cron = require('node-cron');
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');
const { subject } = require('../services/observers');

function startOverdueJob() {
  // roda todo dia à 07:30 (ajusta conforme quiser)
  cron.schedule('30 7 * * *', async () => {
    console.log('--> Verificando reservas atrasadas (job)');
    try {
      const [rows] = await pool.query(`
        SELECT r.reserva_id, r.legacy_bibid, r.titulo, r.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email, r.data_prevista_devolucao
        FROM dg_reservas r
        JOIN dg_usuarios u ON u.usuario_id = r.usuario_id
        WHERE r.status = 'atendida' AND r.data_prevista_devolucao < CURDATE()
      `);

      for (const r of rows) {
        const eventKey = `reserva_atrasada_${r.reserva_id}`;
        // verifica se já existe no log (para evitar notificar sempre)
        const [exists] = await pool.query('SELECT 1 FROM dg_notificacoes_log WHERE chave_evento = ? LIMIT 1', [eventKey]);
        if (exists.length > 0) continue;

        await subject.notify({
          type: 'reserva_atrasada',
          payload: {
            reserva_id: r.reserva_id,
            titulo: r.titulo,
            usuario_id: r.usuario_id,
            usuario_nome: r.usuario_nome,
            usuario_email: r.usuario_email,
            data_devolucao: r.data_prevista_devolucao,
            eventKey
          }
        });

        // registrar chave para não duplicar
        try {
          await pool.query('INSERT IGNORE INTO dg_notificacoes_log (chave_evento, dados) VALUES (?, ?)', [eventKey, JSON.stringify(r)]);
        } catch (err) { /* ignore */ }
      }
    } catch (err) {
      console.error('Erro no job overdueNotifier', err);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });
}

module.exports = { startOverdueJob };
