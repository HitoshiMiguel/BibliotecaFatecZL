// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const AdminController = require('../controller/adminController'); // Importa o objeto completo

// --- NOVAS IMPORTAÇÕES (para o upload) ---
const multer = require('multer');
// Usamos memoryStorage() para enviar ao Google Drive, assim como seu 'upload/index.js' faz
const upload = multer({ storage: multer.memoryStorage() }); 
// --- FIM DAS NOVAS IMPORTAÇÕES ---

// 1. IMPORTAÇÃO DE MIDDLEWARES
const {
  isAuthenticated,
  isAdminOrBibliotecario,
  isAdmin, // se não existir, pode remover
  isBiblioOrAdmin // Novo alias sugerido para clareza
} = require('../middlewares/authMiddleware');

// ===============================================
// 🎯 NOVAS ROTAS DE ESTATÍSTICAS (DASHBOARD ADMIN)
// ===============================================

// ROTA 1: BUSCAR ESTATÍSTICAS DE USUÁRIOS
router.get('/stats/usuarios', isAuthenticated, isAdminOrBibliotecario, AdminController.getStatsUsuarios);

// ROTA 2: BUSCAR ESTATÍSTICAS DE RESERVAS
router.get('/stats/reservas', isAuthenticated, isAdminOrBibliotecario, AdminController.getStatsReservas);

// ===============================================
// 🏠 ROTA DE ESTATÍSTICAS GERAIS (HOME PAGE)
// ===============================================
router.get('/acervo/stats', AdminController.getAcervoStats);


// ===============================================
// ⚙️ ROTAS DE GESTÃO (CRUD e Moderação)
// ===============================================

// --- ROTAS DE GESTÃO DE SOLICITAÇÕES ---
router.get('/solicitacoes', isAuthenticated, isAdminOrBibliotecario, AdminController.getAllSolicitacoes);
router.post('/solicitacoes/:id/aprovar', isAuthenticated, isAdminOrBibliotecario, AdminController.aprovarSolicitacao);
router.post('/solicitacoes/:id/rejeitar', isAuthenticated, isAdminOrBibliotecario, AdminController.rejeitarSolicitacao);

// --- ROTA DE CRIAÇÃO DIRETA DE UTILIZADOR ---
router.post('/usuarios', isAuthenticated, isAdminOrBibliotecario, AdminController.createUsuarioDireto);

// --- ROTAS CRUD PARA UTILIZADORES ---
router.get('/usuarios', isAuthenticated, isAdminOrBibliotecario, AdminController.listAllUsers);
router.get('/usuarios/:id', isAuthenticated, isAdminOrBibliotecario, AdminController.getUserById);

// Removido 'AdminController.updateSubmissao' daqui, pois PUT em /usuarios/:id é apenas para o usuário
router.put('/usuarios/:id', isAuthenticated, isAdminOrBibliotecario, AdminController.updateUser); 

// (Ajuste esta linha se 'isAdmin' não for o nome correto)
router.delete('/usuarios/:id', isAuthenticated, isAdmin, AdminController.deleteUser); 

// --- ROTAS PARA BUSCAR SUBMISSÕES PENDENTES ---
router.get('/submissoes/pendentes', isAuthenticated, isAdminOrBibliotecario, AdminController.getSubmissoesPendentes);

// --- ROTAS PARA MODERAÇÃO DE SUBMISSÕES ---
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
  '/submissoes/:id/link', // Alterado 'view-link' para 'link' para ser mais sucinto
  isAuthenticated,
  isAdminOrBibliotecario,
  AdminController.getSubmissionFileLink
);

// 2. EXPORTAÇÃO ÚNICA
module.exports = router;