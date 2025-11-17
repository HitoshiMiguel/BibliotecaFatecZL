// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController');

// --- NOVAS IMPORTAÇÕES (para o upload) ---
const multer = require('multer');
// Usamos memoryStorage() para enviar ao Google Drive, assim como seu 'upload/index.js' faz
const upload = multer({ storage: multer.memoryStorage() }); 
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// 1. IMPORTAÇÃO ÚNICA E CORRETA
// (Assumindo que seu middleware exporta 'isAdmin' também)
const {
  isAuthenticated,
  isAdminOrBibliotecario,
  isAdmin, // se não existir, pode remover
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
router.put('/usuarios/:id', isAuthenticated, isAdminOrBibliotecario, AdminController.updateUser, AdminController.updateSubmissao);

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

// Deletar publicação já aprovada (remove do Drive + DB)
router.post(
  '/submissoes/:id/deletar-aprovada',
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.deletarPublicacaoAprovada
);

router.put(
  '/submissoes/:id',
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.updateSubmissao
);

router.post(
  '/publicar-direto',
  [isAuthenticated, isAdminOrBibliotecario, upload.single('arquivo')],
  AdminController.publicarDireto // Novo método que vamos criar
);

// --- ROTA PARA BUSCAR LINK DE VISUALIZAÇÃO DO ARQUIVO ---
router.get(
  '/submissoes/:id/view-link',
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.getSubmissionFileLink
);

// 2. EXPORTAÇÃO ÚNICA (você tinha duas)
module.exports = router;