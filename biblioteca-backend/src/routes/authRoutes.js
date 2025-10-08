// src/routes/authRoutes.js
const { sendResetPasswordEmail } = require('../services/emailService');
const nodemailer = require('nodemailer');
// Arquivo: src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto'); // Só uma vez!
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const cadastroRules = [
  body('nome')
    .trim()
    .notEmpty().withMessage('O campo Nome é obrigatório.')
    .isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),

  // 👇 VALIDAÇÃO DE E-MAIL COM REGRA CUSTOMIZADA 👇
  body('email')
    .trim()
    .notEmpty().withMessage('O campo E-mail é obrigatório.')
    .normalizeEmail()
    .isEmail().withMessage('O formato do e-mail é inválido.') // 1. Primeiro, checa se é um email válido
    .custom(email => { // 2. Depois, roda nossa regra personalizada
      if (email.endsWith('.co')) {
        // Se o email terminar com .co, nós lançamos um erro.
        throw new Error('Domínios .co não são permitidos para este cadastro.');
      }
      // Se não, a validação passa.
      return true;
    }),

  body('ra')
    .trim()
    .notEmpty().withMessage('O campo RA é obrigatório.')
    .isLength({ min: 13, max: 13 }).withMessage('O RA deve ter exatamente 13 dígitos.')
    .isNumeric().withMessage('O RA deve conter apenas números.'),

  body('senha')
    .notEmpty().withMessage('O campo Senha é obrigatório.')
    .isLength({ min: 8 }).withMessage('A senha deve ter pelo menos 8 caracteres.'),

  body('confirmarSenha').custom((value, { req }) => {
    if (value !== req.body.senha) {
      throw new Error('As senhas não coincidem.');
    }
    return true;
  }),
];

const handleValidation = (req, res, next) => {
  console.log('--- EXECUTANDO VALIDAÇÃO NO BACKEND ---');
  console.log('Dados recebidos para validação:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Erros de validação encontrados:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  console.log('✅ Validação passou sem erros.');
  next();
};

// --- DEFINIÇÃO DAS ROTAS DA API ---

// Rota para Cadastro de Usuário
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);

// Rota para Login de Usuário
router.post('/login', authController.login);

// Rota para pegar usuário logado
// --- ROTAS DA API ---
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);
router.post('/login', authController.login);
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