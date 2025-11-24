const emailService = require('../emailService');

class EmailObserver {
  async update(event) {
    const { type, payload } = event;

    const to = payload.usuario_email;
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
      }
    } catch (err) {
      console.error('[EmailObserver] falha ao notificar:', err);
    }
  }
}

module.exports = EmailObserver;
