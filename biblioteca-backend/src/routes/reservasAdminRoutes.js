// src/routes/reservasAdminRoutes.js
const express = require('express');
const router = express.Router();

const {
  isAuthenticated,
  isAdminOrBibliotecario,
} = require('../middlewares/authMiddleware');
const ReservasAdminController = require('../controller/reservasAdminController');

// Todas as rotas abaixo exigem estar logado e ter perfil admin/bibliotecário
router.use(isAuthenticated, isAdminOrBibliotecario);

// GET /api/admin/reservas
router.get('/', ReservasAdminController.listarReservas);

// POST /api/admin/reservas/:id/atender
router.post('/:id/atender', ReservasAdminController.atenderReserva);

// POST /api/admin/reservas/:id/cancelar
router.post('/:id/cancelar', ReservasAdminController.cancelarReserva);

// POST /api/admin/reservas/:id/concluir
router.post('/:id/concluir', ReservasAdminController.concluirReserva);

module.exports = router;
