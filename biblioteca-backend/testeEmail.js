// testeEmail.js
require('dotenv').config(); // Carrega o .env
const nodemailer = require('nodemailer');

console.log('--- INICIANDO TESTE DE EMAIL ---');
console.log('USER:', process.env.EMAIL_USER);
// Não mostramos a senha inteira por segurança
console.log('PASS:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 3) + '...' : 'NÃO DEFINIDA');

// Configuração básica
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, 
  logger: true 
});

async function main() {
  try {
    console.log('1. Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');

    console.log('2. Tentando enviar e-mail...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Manda para si mesmo
      subject: 'Teste Biblioteca - Nodemailer',
      text: 'Se você recebeu isso, o envio está funcionando!',
      html: '<b>Se você recebeu isso, o envio está funcionando!</b>'
    });

    console.log('✅ E-mail enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);

  } catch (error) {
    console.error('❌ ERRO FATAL NO TESTE:');
    console.error(error);
  }
}

main();