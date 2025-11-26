// src/services/userBlockService.js
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

/**
 * isUserBlocked(usuarioId)
 * - retorna { blocked: boolean, bloqueadoAte: Date|null, cleared: boolean? }
 * - se bloqueio expirou, limpa automaticamente (status_conta -> 'ativa', bloqueado_ate -> NULL)
 */
async function isUserBlocked(usuarioId) {
  if (!usuarioId) return { blocked: false };

  const [rows] = await pool.query(
    'SELECT status_conta, bloqueado_ate FROM dg_usuarios WHERE usuario_id = ? LIMIT 1',
    [usuarioId]
  );

  if (!rows || rows.length === 0) return { blocked: false };

  const r = rows[0];
  const status = r.status_conta;
  const until = r.bloqueado_ate ? new Date(r.bloqueado_ate) : null;

  // now we consider 'bloqueado' as the blocking value
  if (status === 'bloqueado' && until) {
    const now = new Date();
    if (until > now) {
      return { blocked: true, bloqueadoAte: until };
    } else {
      // bloqueio expirou -> limpa e retorna cleared
      await pool.query(
        'UPDATE dg_usuarios SET status_conta = ?, bloqueado_ate = NULL WHERE usuario_id = ?',
        ['ativa', usuarioId]
      );
      return { blocked: false, cleared: true };
    }
  }

  return { blocked: false };
}

/**
 * blockUserForDays(usuarioId, days)
 * - define status_conta = 'bloqueado' e bloqueado_ate = NOW() + days
 */
async function blockUserForDays(usuarioId, days) {
  if (!usuarioId) return;
  const daysInt = Number(days) || 0;
  if (daysInt <= 0) return;

  await pool.query(
    'UPDATE dg_usuarios SET status_conta = ?, bloqueado_ate = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE usuario_id = ?',
    ['bloqueado', daysInt, usuarioId]
  );
}

module.exports = {
  isUserBlocked,
  blockUserForDays,
};
