// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// --- IMPORTAÇÕES (Apenas uma vez no topo) ---
const authController = require('../controller/authController');
// Importa a função necessária do Middleware APENAS UMA VEZ
const { isAuthenticated } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// --- REGRAS DE VALIDAÇÃO (Middleware Local) ---

const cadastroRules = [
    body('perfilSolicitado').isIn(['aluno', 'professor']).withMessage('Perfil solicitado inválido.'),
    body('nome').trim().notEmpty().withMessage('O campo Nome é obrigatório.').isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),
    body('email').trim().notEmpty().withMessage('O campo E-mail é obrigatório.').normalizeEmail().isEmail().withMessage('O formato do e-mail é inválido.').custom(email => { if (email.endsWith('.co')) { throw new Error('Domínios .co não são permitidos.'); } return true; }),
    body('ra').custom((value, { req }) => { if (req.body.perfilSolicitado === 'aluno' && (!value || value.length !== 13 || !/^\d+$/.test(value))) { throw new Error('O RA deve ter 13 dígitos numéricos e é obrigatório para Aluno.'); } return true; }),
    body('senha').notEmpty().withMessage('O campo Senha é obrigatório.').isLength({ min: 8 }).withMessage('A senha deve ter pelo menos 8 caracteres.'),
    body('confirmarSenha').custom((value, { req }) => { if (req.body.perfilSolicitado === 'professor' && req.body.senha) { return true; } if (value !== req.body.senha) { throw new Error('As senhas não coincidem.'); } return true; }),
];

const handleValidation = (req, res, next) => {
    console.log('--- EXECUTANDO VALIDAÇÃO NO BACKEND ---');
    console.log('Dados recebidos para validação:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Erros de validação:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    console.log('✅ Validação passou.');
    next();
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Cadastro (Aluno/Professor)
router.post('/cadastro', cadastroRules, handleValidation, authController.postCadastro);

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authController.logout);

// Obter utilizador logado (Protegido)
router.get('/current-user', isAuthenticated, authController.getCurrentUser); // Usa isAuthenticated importado no topo

// --- ROTAS DE REDEFINIÇÃO DE SENHA ---

// Solicitar token
router.post('/redefinir-senha-solicitacao', authController.requestResetPassword);

// Redefinir com token
router.post('/redefinir-senha', authController.resetPassword);

// --- ROTA DE ATIVAÇÃO/CONFIRMAÇÃO DE CONTA ---
router.post('/ativar-conta', authController.activateAccount); // Rota para professor definir senha
router.post('/confirmar-conta', authController.confirmAccount); // Rota para professor confirmar email

// --- ROTA PARA ATUALIZAR O PRÓPRIO PERFIL (Protegido) ---
router.put('/profile', isAuthenticated, authController.updateProfile); // Usa isAuthenticated importado no topo


module.exports = router;