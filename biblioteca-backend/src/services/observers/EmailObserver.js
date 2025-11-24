// src/services/observers/EmailObserver.js
const emailService = require('../emailService'); // ajuste caminho se necessário

class EmailObserver {
  async update(event) {
    const { type, payload } = event;
    try {
      if (type === 'livro_disponivel') {
        await emailService.sendBookAvailableEmail(payload.usuario_email, payload);
      } else if (type === 'lembrar_devolucao_hoje') {
        // Busca email do usuario (payload pode vir apenas com usuario_id)
        const to = payload.usuario_email || payload.usuario_email_fallback; // ideal ter email no payload
        // Caso não tenha, carregue do DB (ou ajuste o scheduler para incluir email)
        if (!to && payload.usuario_id) {
          // opcional: buscar email no DB aqui (requer pool import)
        }
        await emailService.sendDueReminderEmail(to || payload.usuario_email, {
          titulo: payload.titulo,
          usuario_nome: payload.usuario_nome,
          linkConsulta: payload.linkConsulta,
          codigo_barras: payload.codigo_barras
        });
      } else if (type === 'reserva_atrasada') {
        const to = payload.usuario_email || payload.usuario_email_fallback;
        await emailService.sendOverdueEmail(to || payload.usuario_email, {
          titulo: payload.titulo,
          usuario_nome: payload.usuario_nome,
          dias_atraso: payload.dias_atraso,
          linkConsulta: payload.linkConsulta,
          codigo_barras: payload.codigo_barras
        });
      }
    } catch (err) {
      console.error('[EmailObserver] falha ao notificar:', err);
      // Não lança pra não interromper subject.notify
    }
  }
}

module.exports = EmailObserver;
