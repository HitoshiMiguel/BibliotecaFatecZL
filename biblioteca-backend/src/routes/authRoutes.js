// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// --- IMPORTAÇÕES ---
const authController = require('../controller/authController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Importação correta e limpa!
const { body, validationResult } = require('express-validator');

// --- REGRAS DE VALIDAÇÃO (Middleware Local) ---

const cadastroRules = [
    // Garante que a validação de RA só ocorre para o perfil 'aluno'
    body('perfilSolicitado').isIn(['aluno', 'professor']).withMessage('Perfil solicitado inválido.'),
    
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
          if (email.endsWith('.co')) {
            throw new Error('Domínios .co não são permitidos para este cadastro.');
          }
          return true;
        }),
    
    // Regra Condicional para RA: SÓ é obrigatório se for 'aluno'
    body('ra').custom((value, { req }) => {
        if (req.body.perfilSolicitado === 'aluno' && (!value || value.length !== 13 || !/^\d+$/.test(value))) {
            throw new Error('O RA deve ter exatamente 13 dígitos e é obrigatório para o perfil Aluno.');
        }
        return true;
    }),

    body('senha')
        .notEmpty().withMessage('O campo Senha é obrigatório.')
        .isLength({ min: 8 }).withMessage('A senha deve ter pelo menos 8 caracteres.'),

    body('confirmarSenha').custom((value, { req }) => {
        if (req.body.perfilSolicitado === 'professor' && req.body.senha) {
             return true; // Pula a checagem se for professor
        }
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

// --- ROTAS DE AUTENTICAÇÃO (Cadastro e Login) ---

// Rota de Cadastro Unificada (Aluno/Professor)
router.post('/cadastro', cadastroRules, handleValidation, authController.postCadastro);

// Rota de Login (Recebe identifier - email/RA - e senha)
router.post('/login', authController.login);

// Rota de Logout
router.post('/logout', authController.logout);

// --- ROTAS DE STATUS E USUÁRIO ---

// Rota para pegar usuário logado (Requer autenticação)
router.get('/current-user', isAuthenticated, authController.getCurrentUser);

// --- ROTAS DE REDEFINIÇÃO DE SENHA ---

// Rota para SOLICITAR token de redefinição (Envia E-mail)
router.post('/redefinir-senha-solicitacao', authController.requestResetPassword);

// Rota para REDEFINIR a senha (Recebe Token e Senha)
router.post('/redefinir-senha', authController.resetPassword);


module.exports = router;