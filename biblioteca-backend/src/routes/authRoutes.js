// Arquivo: src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

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

// --- ROTAS DA API ---
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;