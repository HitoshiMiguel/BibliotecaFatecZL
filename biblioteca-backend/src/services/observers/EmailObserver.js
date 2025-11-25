// src/services/observers/EmailObserver.js
const emailService = require('../emailService');
const { poolSistemaNovo: pool } = require('../../infra/db/mysql/connection');

/**
 * EmailObserver
 * Recebe eventos do subject e envia e-mails.
 * - Espera que o payload contenha `usuario_email` quando possível.
 * - Se não houver email, tenta fallback no DB (mantido para compatibilidade).
 *
 * Também trata evento 'usuario_bloqueado' para notificar usuário do bloqueio.
 */
class EmailObserver {
  async _fetchEmailFromDb(usuarioId) {
    try {
      if (!usuarioId) return null;
      const [rows] = await pool.query('SELECT email FROM dg_usuarios WHERE usuario_id = ? LIMIT 1', [usuarioId]);
      return rows && rows.length ? rows[0].email : null;
    } catch (err) {
      console.error('[EmailObserver] erro ao buscar email no DB:', err && err.message);
      return null;
    }
  }

  async update(event) {
    const { type, payload } = event || {};
    if (!type || !payload) {
      console.warn('[EmailObserver] evento inválido recebido:', event);
      return;
    }

    // prefer email do payload, senão fallback DB
    let to = payload.usuario_email || payload.usuario_email_fallback;
    if (!to && payload.usuario_id) {
      to = await this._fetchEmailFromDb(payload.usuario_id);
    }

    if (!to) {
      console.warn('[EmailObserver] email indefinido para evento', type, 'ID do usuário:', payload.usuario_id);
      return;
    }

    try {
      if (type === 'livro_disponivel') {
        await emailService.sendBookAvailableEmail(to, payload);
      } else if (type === 'lembrar_devolucao_hoje') {
        await emailService.sendDueReminderEmail(to, {
          titulo: payload.titulo,
          usuario_nome: payload.usuario_nome,
          linkConsulta: payload.linkConsulta,
          codigo_barras: payload.codigo_barras
        });
      } else if (type === 'reserva_atrasada') {
        await emailService.sendOverdueEmail(to, {
          titulo: payload.titulo,
          usuario_nome: payload.usuario_nome,
          dias_atraso: payload.dias_atraso,
          linkConsulta: payload.linkConsulta,
          codigo_barras: payload.codigo_barras
        });
      } else if (type === 'reserva_atendida') {
        // e-mail simples de confirmação ao retirar o livro (opcional)
        const subject = `Confirmação de retirada — ${payload.titulo ?? ''}`;
        const html = `
          <div style="font-family:Arial, sans-serif; max-width:640px; margin:18px auto; padding:20px; border:1px solid #eee; border-radius:8px;">
            <h3 style="color:#b71c1c; margin-top:0;">Retirada confirmada</h3>
            <p>Olá ${payload.usuario_nome ?? ''},</p>
            <p>Registramos a retirada do livro <strong>${payload.titulo ?? '—'}</strong>. Data do empréstimo registrada com sucesso.</p>
            <p style="font-size:12px;color:#666;">Se você tiver alguma dúvida, responda este e-mail ou procure a biblioteca.</p>
            <p style="font-size:12px;color:#999;margin-top:12px;">© ${new Date().getFullYear()} Biblioteca Fatec ZL</p>
          </div>
        `;
        await emailService.sendGenericEmail(to, subject, html);
      } else if (type === 'usuario_bloqueado') {
        // payload esperado: { usuario_id, usuario_email?, dias_bloqueio, motivo? }
        const dias = Number(payload.dias_bloqueio || 0);
        const subject = dias > 0 ? `Conta bloqueada por atraso — ${dias} dia(s)` : `Conta bloqueada — Biblioteca`;
        const motivo = payload.motivo ? `<p>Motivo: ${payload.motivo}</p>` : '';
        const html = `
          <div style="font-family:Arial, sans-serif; max-width:640px; margin:18px auto; padding:20px; border:1px solid #eee; border-radius:8px;">
            <h3 style="color:#b71c1c; margin-top:0;">Bloqueio de Conta</h3>
            <p>Olá ${payload.usuario_nome ?? ''},</p>
            <p>Sua conta foi temporariamente bloqueada por <strong>${dias}</strong> dia(s) devido a atraso na devolução de empréstimo(s).</p>
            ${motivo}
            <p style="font-size:13px;color:#555;">Durante este período, você não poderá realizar novas reservas ou renová-las. Caso entenda que houve algum erro, procure a biblioteca.</p>
            <p style="font-size:12px;color:#999;margin-top:12px;">© ${new Date().getFullYear()} Biblioteca Fatec ZL</p>
          </div>
        `;
        await emailService.sendGenericEmail(to, subject, html);
      } else {
        // fallback genérico (caso queira enviar algo custom)
        // console.log('[EmailObserver] evento não mapeado para envio de email:', type);
      }
    } catch (err) {
      console.error('[EmailObserver] falha ao notificar por e-mail:', err && err.message);
      // não lança para não interromper notificação global
    }
  }
}

module.exports = EmailObserver;
