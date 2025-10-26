// src/services/emailService.js

const nodemailer = require('nodemailer');

const APP_NAME = 'Biblioteca Fatec ZL';
const FROM = process.env.EMAIL_USER; // Ex: bibliotecafatecoriginal@gmail.com

// Configuração do transporte SMTP (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: FROM,
        pass: process.env.EMAIL_PASS, // Certifique-se que esta variável está no .env
    },
});

/**
 * Envia um e-mail para redefinição de senha.
 * @param {string} to - Email do destinatário.
 * @param {string} link - URL completa para redefinição.
 */
const sendResetPasswordEmail = async (to, link) => {
    const subject = `Redefinição de senha — ${APP_NAME}`;

    // Apenas o conteúdo HTML - mais robusto para a maioria dos clientes
    const html = `
<!doctype html>
<html>
 <head>
   <meta name="viewport" content="width=device-width,initial-scale=1"/>
   <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
   <title>${subject}</title>
   <style>
     body { margin:0; padding:0; background:#f6f7fb; font-family: Arial, sans-serif; color:#333; font-size: 14px; line-height: 1.5; }
     .wrapper { max-width: 600px; margin: 20px auto; padding: 20px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; }
     .title { font-size: 20px; margin: 0 0 10px; color: #b71c1c; }
     .muted { color:#555; margin-bottom: 20px; }
     .btn { display: inline-block; background-color: #b71c1c; color: #ffffff !important; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; text-align: center; }
     .link-fallback { word-break: break-all; color:#b71c1c; font-size: 12px; margin-top: 15px; }
     .note { font-size: 12px; color:#666; margin-top: 20px; }
     .footer { font-size: 12px; color:#888; text-align:center; margin-top: 25px; }
   </style>
 </head>
 <body>
   <div class="wrapper">
     <h1 class="title">Redefinição de senha</h1>
     <p class="muted">Olá! Recebemos um pedido para redefinir sua senha na <strong>${APP_NAME}</strong>.</p>
     <p style="margin:16px 0 24px;">Clique no botão abaixo para criar uma nova senha:</p>
     <p style="text-align:center;margin-bottom:24px;">
       <a class="btn" href="${link}" target="_blank" rel="noopener" style="color: #ffffff;">Redefinir senha</a>
     </p>
     <p class="muted" style="margin-top:0;">Se o botão não funcionar, copie e cole este link no navegador:</p>
     <p class="link-fallback">${link}</p>
     <p class="note">Este link é válido por <strong>1 hora</strong>. Se você não solicitou esta alteração, ignore este e-mail com segurança.</p>
   </div>
   <p class="footer">© ${new Date().getFullYear()} ${APP_NAME}</p>
 </body>
</html>`;

    // Envio do e-mail (sem o campo 'text' para forçar HTML)
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM}>`, // Formato recomendado para o 'from'
            to,
            subject,
            html, // Apenas HTML
        });
        console.log(`E-mail de redefinição enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de redefinição para ${to}:`, error);
        // Lançar o erro permite que o controller saiba que falhou
        throw new Error('Falha no serviço de envio de e-mail.'); 
    }
};



const sendConfirmationEmail = async (to, confirmationLink) => {
    const subject = `Confirme sua conta - ${APP_NAME}`;
    // HTML Ultra Simplificado e Limpo
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #b71c1c; margin-top: 0;">Confirmação de Conta</h2>
        <p>Olá!</p>
        <p>Sua conta como professor na <strong>${APP_NAME}</strong> foi criada com sucesso.</p>
        <p>Clique no botão abaixo para confirmar seu endereço de e-mail e ativar completamente sua conta:</p>
        <p style="text-align: center; margin: 25px 0;">
            <a href="${confirmationLink}" target="_blank" rel="noopener" style="background-color: #b71c1c; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Confirmar E-mail
            </a>
        </p>
        <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size: 0.9em; word-break: break-all; color: #007bff;">${confirmationLink}</p>
        <p style="font-size: 0.8em; color: #777; margin-top: 20px;">Este link é válido por 24 horas.</p>
        <p style="font-size: 0.8em; color: #999; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
    </div>
    `;

    try {
        await transporter.sendMail({
             from: `"${APP_NAME}" <${FROM}>`,
             to,
             subject,
             html // Apenas HTML limpo
        });
        console.log(`E-mail de confirmação enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de confirmação para ${to}:`, error);
        throw new Error('Falha no serviço de envio de e-mail de confirmação.');
    }
}

/**
 * Envia e-mail para ATIVAÇÃO (Professor define a senha).
 */
const sendActivationEmail = async (to, activationLink) => {
    const subject = `Ative sua conta - ${APP_NAME}`;
    // HTML Corrigido e Simplificado
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #b71c1c; margin-top: 0;">Ativação de Conta</h2>
        <p>Olá!</p>
        <p>Sua conta como professor na <strong>${APP_NAME}</strong> foi criada.</p>
        <p>Clique no botão abaixo para definir sua senha e ativar sua conta:</p>
        <p style="text-align: center; margin: 25px 0;">
            <a href="${activationLink}" target="_blank" rel="noopener" style="background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Ativar Conta e Definir Senha
            </a>
        </p>
        <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size: 0.9em; word-break: break-all; color: #007bff;">${activationLink}</p>
        <p style="font-size: 0.8em; color: #777; margin-top: 20px;">Este link é válido por 24 horas.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999; text-align: center;">© ${new Date().getFullYear()} ${APP_NAME}</p>
    </div>
    `;

     try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM}>`,
            to,
            subject,
            html // Envia o HTML correto
        });
        console.log(`E-mail de ATIVAÇÃO enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de ATIVAÇÃO para ${to}:`, error);
        throw new Error('Falha no serviço de envio de e-mail de ativação.');
    }
};

// ... (sendResetPasswordEmail e module.exports)
module.exports = { sendResetPasswordEmail, sendConfirmationEmail, sendActivationEmail };