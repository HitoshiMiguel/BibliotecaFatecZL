const cron = require('node-cron');
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

const iniciarAgendador = () => {
    // Roda a cada 1 minuto
    cron.schedule('*/1 * * * *', async () => {
        try {
            // Verifica itens agendados cuja data já chegou
            const sql = `
                UPDATE dg_itens_digitais 
                SET status = 'publicado' 
                WHERE status = 'agendado' 
                AND data_publicacao <= NOW()
            `;

            const [result] = await pool.execute(sql);

            if (result.affectedRows > 0) {
                console.log(`[Cron Job] ${result.affectedRows} item(ns) publicado(s) automaticamente.`);
            }
        } catch (error) {
            console.error('[Cron Job] Erro ao verificar agendamentos:', error);
        }
    });
    
    console.log('--> Serviço de Agendamento de Publicações iniciado.');
};

module.exports = iniciarAgendador;