// src/services/emailService.js

const nodemailer = require('nodemailer');

const APP_NAME = 'Biblioteca Fatec ZL';
// Garante que não há espaços extras nas variáveis de ambiente
const FROM = (process.env.EMAIL_USER || '').trim();
const PASS = (process.env.EMAIL_PASS || '').trim();

console.log(`[EmailService] Iniciando serviço com usuário: ${FROM}`);

// Configuração do transporte SMTP (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: FROM,
        pass: PASS,
    },
    // Adiciona timeout para evitar travamentos
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Verifica a conexão ao iniciar
transporter.verify(function (error, success) {
    if (error) {
        console.error('[EmailService] ❌ Erro na conexão SMTP:', error);
    } else {
        console.log('[EmailService] ✅ Servidor SMTP pronto para enviar mensagens');
    }
});

/**
 * Envia um e-mail para redefinição de senha.
 */
const sendResetPasswordEmail = async (to, link) => {
    const subject = `Redefinição de senha — ${APP_NAME}`;
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

    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM}>`,
            to,
            subject,
            html,
        });
        console.log(`E-mail de redefinição enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de redefinição para ${to}:`, error);
        throw new Error('Falha no serviço de envio de e-mail.'); 
    }
};

const sendConfirmationEmail = async (to, confirmationLink) => {
    const subject = `Confirme sua conta - ${APP_NAME}`;
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
             html
        });
        console.log(`E-mail de confirmação enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de confirmação para ${to}:`, error);
        throw new Error('Falha no serviço de envio de e-mail de confirmação.');
    }
}

const sendActivationEmail = async (to, activationLink) => {
    const subject = `Ative sua conta - ${APP_NAME}`;
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
            html 
        });
        console.log(`E-mail de ATIVAÇÃO enviado para ${to}`);
    } catch (error) {
        console.error(`Falha ao enviar e-mail de ATIVAÇÃO para ${to}:`, error);
        throw new Error('Falha no serviço de envio de e-mail de ativação.');
    }
};

const sendBookAvailableEmail = async (to, payload = {}) => {
  const titulo = payload.titulo ?? 'Livro disponível';
  const usuarioNome = payload.usuario_nome ?? 'usuário';
  const linkConsulta = payload.linkConsulta ?? (process.env.FRONTEND_URL || 'http://localhost:3000');

  const subject = `📚 Agora disponível — ${titulo}`;

  const html = `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f6f7fb; font-family: Arial, sans-serif; color:#333; font-size:14px; line-height:1.5; }
    .wrapper { max-width: 640px; margin: 20px auto; padding: 20px; background: #ffffff; border: 1px solid #e6e6e6; border-radius: 10px; }
    .header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
    .logo { width:48px; height:48px; border-radius:8px; background:#b71c1c; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; }
    .title { font-size:18px; margin:0; color:#111; }
    .lead { color:#555; margin: 8px 0 18px; }
    .card { border:1px solid #f0f0f0; padding:14px; border-radius:8px; background:#fafafa; }
    .book-title { font-weight:700; font-size:16px; margin:0 0 6px; color:#0b2a4a; }
    .meta { color:#666; font-size:13px; margin-bottom:12px; }
    .cta { display:inline-block; padding:12px 20px; background:#b71c1c; color:#fff !important; border-radius:8px; text-decoration:none; font-weight:700; }
    .small { font-size:12px; color:#777; margin-top:14px; }
    .footer { font-size:12px; color:#999; text-align:center; margin-top:20px; }
    a.plain { color:#b71c1c; word-break:break-all; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <h1 class="title">Livro disponível na biblioteca</h1>
        <div style="color:#666; font-size:13px;">Aviso automático — ${APP_NAME}</div>
      </div>
    </div>

    <p class="lead">Olá <strong>${usuarioNome}</strong>,</p>

    <div class="card">
      <p class="book-title">${titulo}</p>
      ${payload.autor ? `<div class="meta">Autor: ${payload.autor}</div>` : ''}
      ${payload.editora ? `<div class="meta">Editora: ${payload.editora}</div>` : ''}
      <p style="margin:10px 0 0;">
        O item que você favoritou está disponível para empréstimo. Clique no botão abaixo para ver a publicação e, se desejar, efetuar a reserva.
      </p>

      <div style="margin-top:14px;">
        <a class="cta" href="${linkConsulta}" target="_blank" rel="noopener">Ver publicação</a>
      </div>

      <p class="small">
        Caso prefira, copie/cole este link no navegador: <br/>
        <a class="plain" href="${linkConsulta}">${linkConsulta}</a>
      </p>
    </div>

    <p class="small">
      Se você não deseja receber mais avisos sobre este item, remova-o dos seus favoritos na sua conta.
    </p>

    <p class="footer">© ${new Date().getFullYear()} ${APP_NAME}</p>
  </div>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM}>`,
      to,
      subject,
      html
    });
    console.log(`[EmailService] livro_disponivel enviado para ${to} — ${titulo}`);
  } catch (err) {
    console.error('[EmailService] falha ao enviar livro_disponivel:', err);
    throw err;
  }
};

const sendDueReminderEmail = async (to, { titulo, usuario_nome, linkConsulta, codigo_barras }) => {
  const subject = `Lembrete: seu empréstimo vence hoje — Biblioteca Fatec ZL`;
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      body { margin:0; padding:0; background:#f6f7fb; font-family: Arial, sans-serif; color:#333; }
      .card { max-width:600px; margin:20px auto; padding:20px; background:#fff; border-radius:8px; border:1px solid #e6e6e6; }
      .title { color:#b71c1c; font-size:20px; margin:0 0 10px; }
      .btn { display:inline-block; padding:12px 18px; background:#b71c1c; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; }
      .muted { color:#555; font-size:14px; }
      .meta { font-size:13px; color:#666; margin-top:8px; }
      .footer { font-size:12px; color:#888; text-align:center; margin-top:20px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Lembrete de Devolução — Hoje</h1>
      <p class="muted">Olá ${usuario_nome || ''},</p>
      <p>Este é um lembrete de que o empréstimo do livro <strong>${titulo || '—'}</strong> vence hoje. Por favor, devolva o exemplar na biblioteca para evitar multa.</p>
      ${codigo_barras ? `<p class="meta"><strong>Código:</strong> ${codigo_barras}</p>` : ''}
      <p style="text-align:center;margin:24px 0;">
      <a href="${linkConsulta}" target="_blank" rel="noopener"
         style="display:inline-block;padding:12px 20px;border-radius:6px;background:#b71c1c;text-decoration:none;font-weight:600;color:#ffffff !important;">
         Ver publicação
      </a>
    </p>
      <p class="muted" style="margin-top:14px;">Se já devolveu, desconsidere este aviso.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Biblioteca Fatec ZL</div>
  </body>
  </html>
  `;
  try {
    await transporter.sendMail({ from: `"Biblioteca Fatec ZL" <${FROM}>`, to, subject, html });
    console.log(`[EmailService] sendDueReminderEmail -> enviado para ${to}`);
  } catch (err) {
    console.error(`[EmailService] erro sendDueReminderEmail para ${to}:`, err);
    throw err;
  }
};

const sendOverdueEmail = async (to, { titulo, usuario_nome, dias_atraso = 0, linkConsulta, codigo_barras }) => {
  const subject = `Atenção: empréstimo em atraso — Biblioteca Fatec ZL`;
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      body { margin:0; padding:0; background:#fff6f6; font-family: Arial, sans-serif; color:#333; }
      .card { max-width:600px; margin:20px auto; padding:20px; background:#fff; border-radius:8px; border:1px solid #f3c6c6; }
      .title { color:#b20000; font-size:20px; margin:0 0 10px; }
      .btn { display:inline-block; padding:12px 18px; background:#b20000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; }
      .muted { color:#555; font-size:14px; }
      .meta { font-size:13px; color:#666; margin-top:8px; }
      .footer { font-size:12px; color:#888; text-align:center; margin-top:20px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Empréstimo em Atraso</h1>
      <p class="muted">Olá ${usuario_nome || ''},</p>
      <p>O empréstimo do livro <strong>${titulo || '—'}</strong> encontra-se <strong>em atraso</strong> há ${dias_atraso} dia(s). Por favor, devolva o mais rápido possível ou entre em contato com a biblioteca.</p>
      ${codigo_barras ? `<p class="meta"><strong>Código:</strong> ${codigo_barras}</p>` : ''}
      <p style="text-align:center;margin:24px 0;">
      <a href="${linkConsulta}" target="_blank" rel="noopener"
         style="display:inline-block;padding:12px 20px;border-radius:6px;background:#b71c1c;text-decoration:none;font-weight:600;color:#ffffff !important;">
         Ver publicação
      </a>
    </p>
      <p class="muted" style="margin-top:14px;">A não devolução pode acarretar penalidades (consulte regras da biblioteca).</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Biblioteca Fatec ZL</div>
  </body>
  </html>
  `;
  try {
    await transporter.sendMail({ from: `"Biblioteca Fatec ZL" <${FROM}>`, to, subject, html });
    console.log(`[EmailService] sendOverdueEmail -> enviado para ${to}`);
  } catch (err) {
    console.error(`[EmailService] erro sendOverdueEmail para ${to}:`, err);
    throw err;
  }
};


const sendGenericEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${FROM}>`,
            to,
            subject,
            html,
        });
    } catch (e) {
        console.error("Erro ao enviar e-mail genérico:", e);
        throw e;
    }
};

/**
 * Envia notificação de Reserva Realizada (Físico)
 */
async function enviarEmailReservaRealizada(email, nomeAluno, tituloLivro, dataRetirada) {
  const assunto = `📚 Reserva Confirmada: ${tituloLivro}`;
  
  // Formata a data se ela vier como AAAA-MM-DD
  let dataFormatada = dataRetirada;
  if (dataRetirada.includes('-')) {
    dataFormatada = dataRetirada.split('-').reverse().join('/');
  }

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <!-- MUDANÇA AQUI: background-color de verde (#28a745) para vermelho (#b20000) -->
      <div style="background-color: #b20000; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reserva Realizada!</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px;">Olá, <strong>${nomeAluno}</strong>!</p>
        <p style="font-size: 16px; line-height: 1.5;">
          Sua reserva foi registrada com sucesso no sistema. O item será separado para você.
        </p>
        <!-- MUDANÇA AQUI: border-left de verde (#28a745) para vermelho (#b20000) -->
        <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #b20000; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📘 Livro:</strong> ${tituloLivro}</p>
          <p style="margin: 5px 0;"><strong>📅 Retirada Prevista:</strong> ${dataFormatada}</p>
          <p style="margin: 5px 0;"><strong>📍 Local:</strong> Balcão da Biblioteca</p>
        </div>
        <p style="font-size: 14px; color: #666;">
          *Não esqueça de levar sua carteirinha ou documento com foto.
        </p>
      </div>
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        <p style="margin: 0;">Biblioteca Fatec - Sistema Automático</p>
      </div>
    </div>
  `;

  try {
    // Usa o transporter que JÁ EXISTE nesse arquivo
    await transporter.sendMail({
      from: `"Biblioteca Fatec ZL" <${FROM}>`,
      to: email,
      subject: assunto,
      html: htmlTemplate,
    });
    console.log(`[EmailService] Confirmação de reserva enviada para ${email}`);
  } catch (error) {
    console.error('[EmailService] Erro ao enviar email:', error);
  }
}

module.exports = {
   sendResetPasswordEmail,
   sendConfirmationEmail,
   sendActivationEmail,
   sendGenericEmail,
   sendBookAvailableEmail,
   sendDueReminderEmail,
   sendOverdueEmail,
   enviarEmailReservaRealizada // Função exportada!
};