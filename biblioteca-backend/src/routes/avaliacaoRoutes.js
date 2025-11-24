// src/routes/avaliacaoRoutes.js
const router = require('express').Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const AvaliacaoController = require('../controller/AvaliacaoController');

// Middleware para logar todas as requisições nessa rota
router.use((req, res, next) => {
  console.log(`[AvaliacaoRoutes] ${req.method} ${req.path}`);
  next();
});

// GET avaliações de um item (público)
router.get('/:id/avaliacoes', (req, res, next) => {
  console.log('[AvaliacaoRoutes] GET /:id/avaliacoes - chamado');
  AvaliacaoController.getAvaliacoes(req, res, next);
});

// POST/UPDATE avaliação (requer autenticação)
router.post('/:id/avaliar', isAuthenticated, (req, res, next) => {
  console.log('[AvaliacaoRoutes] POST /:id/avaliar - passou no middleware isAuthenticated');
  AvaliacaoController.salvarAvaliacao(req, res, next);
});

// DELETE avaliação (requer autenticação)
router.delete('/:id/avaliar', isAuthenticated, AvaliacaoController.deletarAvaliacao);

module.exports = router;
