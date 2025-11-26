// src/routes/avaliacaoRoutes.js
const router = require('express').Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const AvaliacaoController = require('../controller/AvaliacaoController');
const AcessoController = require('../controller/AcessoController');



// Middleware para logar todas as requisições nessa rota
router.use((req, res, next) => {
  console.log(`[AvaliacaoRoutes] ${req.method} ${req.path}`);
  next();
});

router.get('/acessar/:id', AcessoController.registrarAcesso);

router.get('/minhas-estatisticas', isAuthenticated, AvaliacaoController.getMinhasEstatisticas);
// GET avaliações de um item
// MUDANÇA AQUI: Adicionei o 'isAuthenticated' para o backend saber QUEM está logado
// Se o usuário mandar o token, o controller vai saber quem é e devolver a nota dele (amarelinha).
// Se não mandar token, vai dar 401 e o frontend trata mostrando só a média.
router.get('/:id/avaliacoes', isAuthenticated, (req, res, next) => {
  console.log('[AvaliacaoRoutes] GET /:id/avaliacoes - autenticado');
  AvaliacaoController.getAvaliacoes(req, res, next);
});

// POST/UPDATE avaliação (requer autenticação)
router.post('/:id/avaliar', isAuthenticated, (req, res, next) => {
  console.log('[AvaliacaoRoutes] POST /:id/avaliar - autenticado');
  AvaliacaoController.salvarAvaliacao(req, res, next);
});

// DELETE avaliação (requer autenticação)
router.delete('/:id/avaliar', isAuthenticated, AvaliacaoController.deletarAvaliacao);

module.exports = router;