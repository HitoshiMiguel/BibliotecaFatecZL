const { poolSistemaNovo: pool } = require('../../infra/db/mysql/connection');

/**
 * DBObserver: grava registro na tabela dg_notificacoes e opcionalmente em log de eventos
 */
class DBObserver {
  constructor() {}

  async update(event) {
    const { type, payload } = event;

    const usuarioId = payload.usuario_id || null;
    const titulo = payload.titulo || null;
    const mensagem = payload.mensagem || null;
    const meta = JSON.stringify(payload || {});

    const [result] = await pool.query(
      `INSERT INTO dg_notificacoes (usuario_id, tipo, titulo, mensagem, meta, enviado) VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, type, titulo, mensagem, meta, false]
    );

    // registra chave de evento para evitar duplicatas (se quiser)
    if (payload.eventKey) {
      try {
        await pool.query(
          `INSERT IGNORE INTO dg_notificacoes_log (chave_evento, dados) VALUES (?, ?)`,
          [payload.eventKey, JSON.stringify(payload)]
        );
      } catch (err) {
        console.warn('erro ao gravar notificacoes_log', err.message);
      }
    }

    return result;
  }
}

module.exports = DBObserver;
