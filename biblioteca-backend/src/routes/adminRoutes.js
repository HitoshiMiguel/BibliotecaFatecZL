// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController'); // Corretamente em camelCase
const authMiddleware = require('../middleware/authMiddleware'); 

// --- ROTAS DE ADMIN (Níveis de Acesso: ADM/BIBLIOTECÁRIO) ---

// Para o teste de Admin, deixaremos a rota de criação SEM o middleware por enquanto.
// TODAS AS OUTRAS ROTAS ABAIXO PRECISAM DO MIDDLEWARE!

// 1. Listar solicitações pendentes (GET /solicitacoes)
router.get('/solicitacoes', authMiddleware.isAuthenticated, authMiddleware.isAdmin, AdminController.getAllSolicitacoes);

// 2. Aprovar solicitação (POST /solicitacoes/:id/aprovar)
router.post('/solicitacoes/:id/aprovar', authMiddleware.isAuthenticated, authMiddleware.isAdmin, AdminController.aprovarSolicitacao);

// 3. Rejeitar solicitação (POST /solicitacoes/:id/rejeitar) - LINHA 15
router.post('/solicitacoes/:id/rejeitar', authMiddleware.isAuthenticated, authMiddleware.isAdmin, AdminController.rejeitarSolicitacao);

// 4. Criação Direta (Admin/Bibliotecário)
// MODO TEMPORÁRIO PARA CRIAÇÃO DO ADMIN DE TESTE (Sem Middleware)
router.post('/usuarios', AdminController.createUsuarioDireto);

// MODO SEGURO (DEPOIS DO TESTE):
// router.post('/usuarios', authMiddleware.isAuthenticated, authMiddleware.isAdmin, AdminController.createUsuarioDireto);

module.exports = router;