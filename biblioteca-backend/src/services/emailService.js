const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetPasswordEmail = async (to, link) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Redefinição de senha',
    html: `<p>Clique <a href="${link}">aqui</a> para redefinir sua senha.</p>`
  });
};

module.exports = { sendResetPasswordEmail };
