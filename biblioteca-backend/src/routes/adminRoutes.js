// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController');

// 1. IMPORTAÇÃO ÚNICA E CORRETA
// (Assumindo que seu middleware exporta 'isAdmin' também)
const {
  isAuthenticated,
  isAdminOrBibliotecario,
  isAdmin // Se 'isAdmin' não existir, remova-o
} = require('../middlewares/authMiddleware');

// --- ROTAS DE GESTÃO DE SOLICITAÇÕES ---
// (Corrigido para usar o novo padrão)
router.get('/solicitacoes', isAuthenticated, isAdminOrBibliotecario, AdminController.getAllSolicitacoes);
router.post('/solicitacoes/:id/aprovar', isAuthenticated, isAdminOrBibliotecario, AdminController.aprovarSolicitacao);
router.post('/solicitacoes/:id/rejeitar', isAuthenticated, isAdminOrBibliotecario, AdminController.rejeitarSolicitacao);

// --- ROTA DE CRIAÇÃO DIRETA DE UTILIZADOR ---
// (Corrigido para usar o novo padrão)
router.post('/usuarios', isAuthenticated, isAdminOrBibliotecario, AdminController.createUsuarioDireto);

// --- NOVAS ROTAS CRUD PARA UTILIZADORES ---
// (Corrigido para usar o novo padrão)
router.get('/usuarios', isAuthenticated, isAdminOrBibliotecario, AdminController.listAllUsers);
router.get('/usuarios/:id', isAuthenticated, isAdminOrBibliotecario, AdminController.getUserById);
router.put('/usuarios/:id', isAuthenticated, isAdminOrBibliotecario, AdminController.updateUser);

// (Ajuste esta linha se 'isAdmin' não for o nome correto)
router.delete('/usuarios/:id', isAuthenticated, isAdmin, AdminController.deleteUser); 

// --- ROTAS PARA BUSCAR SUBMISSÕES PENDENTES ---
// (Corrigido para usar o novo padrão)
router.get('/submissoes/pendentes', isAuthenticated, isAdminOrBibliotecario, AdminController.getSubmissoesPendentes);

// --- ROTAS PARA MODERAÇÃO DE SUBMISSÕES ---
// (Já estavam corretas)
router.post(
  '/submissoes/:id/aprovar',
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.aprovarSubmissao
);

router.post(
  '/submissoes/:id/reprovar',
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.reprovarSubmissao
);

// 2. EXPORTAÇÃO ÚNICA (você tinha duas)
module.exports = router;