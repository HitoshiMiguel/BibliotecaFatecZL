// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const pool = require('../config/db');
const authController = require('../controller/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { sendResetPasswordEmail } = require('../services/emailService');

// util/middlewares de erro/validação (já citados)
const { err } = require('../utils/httpError');           // <— usa para padronizar erros
const { required } = require('../middlewares/validate'); // <— campos obrigatórios

// === Rate limit simples (30s) para reenvio de e-mail de reset ===
const lastResetByEmail = new Map();
const COOLDOWN_MS = 30 * 1000;

// === Validações de cadastro (mantidas) ===
const cadastroRules = [
  body('nome')
    .trim()
    .notEmpty().withMessage('O campo Nome é obrigatório.')
    .isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),

  body('email')
    .trim()
    .notEmpty().withMessage('O campo E-mail é obrigatório.')
    .normalizeEmail()
    .isEmail().withMessage('O formato do e-mail é inválido.')
    .custom(email => {
      if (email.endsWith('.co')) throw new Error('Domínios .co não são permitidos para este cadastro.');
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
    if (value !== req.body.senha) throw new Error('As senhas não coincidem.');
    return true;
  }),
];

// === Tratador de validação -> agora usa o error handler global ===
const handleValidation = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // pega a primeira mensagem (ou junte todas se preferir)
    const msg = errors.array().map(e => e.msg).join('; ');
    return next(err(400, 'VALIDATION_ERROR', msg));
  }
  return next();
};

// ================= ROTAS =================

// Cadastro
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);

// Login (se quiser, aplique uma validação básica também)
router.post('/login',
  required(['email','senha']), // garante campos
  authController.login
);

// Usuário logado (precisa estar autenticado)
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout
router.post('/logout', authController.logout);

// Solicitar redefinição de senha (envio do e-mail)
router.post('/redefinir-senha', required(['email']), async (req, res, next) => {
  try {
    const { email } = req.body;

    // Rate limit de 30s por e-mail
    const now = Date.now();
    const last = lastResetByEmail.get(email) || 0;
    if (now - last < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      return next(err(429, 'RATE_LIMIT', `Aguarde ${remaining}s para solicitar novamente.`));
    }
    lastResetByEmail.set(email, now);

    // Gera token e expiração
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 3600 * 1000); // 1 hora

    // Atualiza token no banco
    await pool.query(
      'UPDATE dg_usuarios SET reset_token = ?, reset_token_expira = ? WHERE email = ?',
      [token, expira, email]
    );

    // Gera link de redefinição
    const link = `http://localhost:3000/nova-senha?token=${token}`;

    // Envia e-mail (não vaza se o e-mail existe ou não)
    await sendResetPasswordEmail(email, link);

    return res.json({ ok: true, message: 'Se existir uma conta com este e-mail, enviaremos um link de redefinição.' });
  } catch (e) {
    return next(err(500, 'DEFAULT', 'Erro ao processar a solicitação de redefinição de senha.'));
  }
});

// Redefinir senha com token
router.post('/nova-senha', required(['token','senha']), async (req, res, next) => {
  try {
    const { token, senha } = req.body;

    // Token válido e não expirado?
    const [rows] = await pool.query(
      'SELECT id FROM dg_usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
      [token]
    );
    if (!rows.length) {
      return next(err(410, 'TOKEN_EXPIRED', 'Token inválido ou expirado.'));
    }

    // Atualiza senha e limpa token
    const senhaHash = await bcrypt.hash(senha, 10);
    await pool.query(
      'UPDATE dg_usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE reset_token = ?',
      [senhaHash, token]
    );

    return res.json({ ok: true, message: 'Senha redefinida com sucesso!' });
  } catch (e) {
    return next(err(500, 'DEFAULT', 'Erro ao redefinir a senha.'));
  }
});

module.exports = router;