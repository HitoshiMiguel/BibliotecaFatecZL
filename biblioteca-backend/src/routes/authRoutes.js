// src/routes/authRoutes.js
const { sendResetPasswordEmail } = require('../services/emailService');
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto'); // Só uma vez!
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// --- REGRAS DE VALIDAÇÃO PARA CADASTRO ---
const cadastroRules = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('email').trim().notEmpty().withMessage('E-mail é obrigatório.').isEmail().withMessage('E-mail inválido.'),
  body('ra').trim().notEmpty().withMessage('RA é obrigatório.'),
  body('senha').notEmpty().withMessage('Senha é obrigatória.').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres.'),
  body('confirmarSenha').custom((value, { req }) => {
    if (value !== req.body.senha) {
      throw new Error('As senhas não coincidem.');
    }
    return true;
  }),
];

// --- MIDDLEWARE DE VALIDAÇÃO CORRIGIDO ---
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// --- DEFINIÇÃO DAS ROTAS DA API ---

// Rota para Cadastro de Usuário
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);

// Rota para Login de Usuário
router.post('/login', authController.login);

// Rota para pegar usuário logado
router.get('/me', authMiddleware, authController.getCurrentUser);

router.post('/logout', authController.logout);

router.post('/redefinir-senha', async (req, res) => {
  const { email } = req.body;
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 3600 * 1000); // 1 hora

    // Atualiza token no banco
    await pool.query(
      'UPDATE dg_usuarios SET reset_token = ?, reset_token_expira = ? WHERE email = ?',
      [token, expira, email]
    );

    // Gera link de redefinição
    const link = `http://localhost:3000/nova-senha?token=${token}`;

    // Chama o serviço de envio de email
    await sendResetPasswordEmail(email, link);

    res.json({ mensagem: 'Se o e-mail existir, enviaremos o link de redefinição.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: 'Erro ao processar requisição' });
  }
});


// Rota para redefinir a senha usando o token
router.post('/nova-senha', async (req, res) => {
  const { token, senha } = req.body;
  const [rows] = await pool.query(
    'SELECT * FROM dg_usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
    [token]
  );
  if (!rows.length) {
    return res.json({ mensagem: 'Token inválido ou expirado.' });
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  await pool.query(
    'UPDATE dg_usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE reset_token = ?',
    [senhaHash, token]
  );
  res.json({ mensagem: 'Senha redefinida com sucesso!' });
});

module.exports = router;