// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// --- ROTAS DE GESTÃO DE SOLICITAÇÕES (Existentes) ---
router.get('/solicitacoes', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.getAllSolicitacoes);
router.post('/solicitacoes/:id/aprovar', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.aprovarSolicitacao);
router.post('/solicitacoes/:id/rejeitar', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.rejeitarSolicitacao);

// --- ROTA DE CRIAÇÃO DIRETA DE UTILIZADOR (Existente) ---
// Usar isAdminOrBibliotecario para permitir que ambos criem contas
router.post('/usuarios', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.createUsuarioDireto);


// --- NOVAS ROTAS CRUD PARA UTILIZADORES ---

// GET /api/admin/usuarios - Listar todos os utilizadores
router.get('/usuarios', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.listAllUsers);

// GET /api/admin/usuarios/:id - Obter detalhes de um utilizador
router.get('/usuarios/:id', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.getUserById);

// PUT /api/admin/usuarios/:id - Atualizar um utilizador
// Usamos PUT para atualização completa ou parcial aqui
router.put('/usuarios/:id', authMiddleware.isAuthenticated, authMiddleware.isAdminOrBibliotecario, AdminController.updateUser);

// DELETE /api/admin/usuarios/:id - Excluir um utilizador
router.delete('/usuarios/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, AdminController.deleteUser); // Talvez só Admin possa excluir? Ajuste se necessário.


module.exports = router;