// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

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
    // ❌ Antes: res.render(...)
    // ✅ Agora: res.json(...)
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// --- DEFINIÇÃO DAS ROTAS DA API ---

// Rota para Cadastro de Usuário
// URL final: POST /api/register
router.post('/register', cadastroRules, handleValidation, authController.postCadastro);

// Rota para Login de Usuário
// URL final: POST /api/login
router.post('/login', authController.login); // Supondo que a função login está no seu controller

// Deve ficar assim novamente:
router.get('/me', authMiddleware, authController.getCurrentUser);

router.post('/logout', authController.logout);

module.exports = router;