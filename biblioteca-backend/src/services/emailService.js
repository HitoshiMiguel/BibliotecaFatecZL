const nodemailer = require('nodemailer');

const APP_NAME = 'Biblioteca Fatec ZL';
const FROM = process.env.EMAIL_USER; // ex.: bibliotecafatecoriginal@gmail.com

// Configuração do transporte SMTP (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: FROM,
    pass: process.env.EMAIL_PASS,
  },
});

// Função principal para envio do e-mail
const sendResetPasswordEmail = async (to, link) => {
  const subject = `Redefinição de senha — ${APP_NAME}`;

  const text = `Olá!

Recebemos um pedido para redefinir sua senha no ${APP_NAME}.
Use o link abaixo para criar uma nova senha (válido por 1 hora):

${link}

Se você não solicitou, pode ignorar este e-mail.`;

  const html = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${APP_NAME} – Redefinição de senha</title>
    <style>
      body { margin:0; padding:0; background:#f6f7fb; font-family:Arial,Helvetica,sans-serif; color:#222; }
      .wrapper { max-width:560px; margin:0 auto; padding:24px; }
      .card { background:#ffffff; border:1px solid #eaeaea; border-radius:10px; padding:24px; }
      .title { font-size:20px; margin:0 0 8px; }
      .muted { color:#555; font-size:14px; margin:0 0 20px; }
      .btn { display:inline-block; background:#b71c1c; color:#fff !important;
             padding:12px 18px; border-radius:6px; text-decoration:none; font-weight:600; }
      .link { word-break:break-all; color:#b71c1c; font-size:12px; }
      .note { font-size:12px; color:#666; margin-top:18px; line-height:1.5; }
      .footer { font-size:12px; color:#888; text-align:center; margin-top:24px; }
      @media (prefers-color-scheme: dark){
        body{ background:#111; color:#eee; }
        .card{ background:#1b1b1b; border-color:#2a2a2a; }
        .muted,.note,.footer{ color:#aaa; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <h1 class="title">Redefinição de senha</h1>
        <p class="muted">Olá! Recebemos um pedido para redefinir sua senha no <strong>${APP_NAME}</strong>.</p>
        <p style="margin:16px 0 24px;">Clique no botão abaixo para criar uma nova senha:</p>
        <p style="text-align:center;margin-bottom:24px;">
          <a class="btn" href="${link}" target="_blank" rel="noopener">Redefinir senha</a>
        </p>
        <p class="muted" style="margin-top:0;">Se o botão não funcionar, copie e cole este link no navegador:</p>
        <p class="link">${link}</p>
        <p class="note">Este link é válido por <strong>1 hora</strong>. Se você não solicitou esta alteração, ignore este e-mail com segurança.</p>
      </div>
      <p class="footer">© ${new Date().getFullYear()} ${APP_NAME}</p>
    </div>
  </body>
</html>`;

  // Envio do e-mail
  await transporter.sendMail({
    from: `${APP_NAME} <${FROM}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendResetPasswordEmail };


module.exports = { sendResetPasswordEmail };
