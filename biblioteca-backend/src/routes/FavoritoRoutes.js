// Em: src/app/routes/FavoritoRoutes.js
const express = require('express');
const router = express.Router();
const FavoritoController = require('../controller/FavoritoController');

// Importamos o middleware de autenticação
// (Corrigindo o caminho para 'middlewares' no plural, como vimos no app.js)
const { isAuthenticated } = require('../middlewares/authMiddleware'); 

// --- [NOVO] Rota para LISTAR os favoritos ---
// GET /api/favoritos/
// Protegida: precisa estar logado
router.get(
    '/',
    isAuthenticated, // 1. Protege a rota e pega o req.user.id
    FavoritoController.listar // 2. Executa o controller de listagem
);

// --- Rota para ADICIONAR um favorito ---
// POST /api/favoritos/
// Protegida: precisa estar logado
router.post(
    '/', 
    isAuthenticated, // 1. Verifica se está logado e pega o req.user.id
    FavoritoController.adicionar // 2. Executa o controller
);

// --- Rota para REMOVER um favorito ---
// DELETE /api/favoritos/:itemId
// Protegida: precisa estar logado
router.delete(
    '/:itemId', // O :itemId será pego em 'req.params.itemId'
    isAuthenticated, // 1. Verifica se está logado e pega o req.user.id
    FavoritoController.remover // 2. Executa o controller
);

module.exports = router;