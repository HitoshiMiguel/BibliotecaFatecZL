// src/routes/reservasAdminRoutes.js
const express = require('express');
const router = express.Router();

const {
  isAuthenticated,
  isAdminOrBibliotecario,
} = require('../middlewares/authMiddleware');
const reservasAdminController = require('../controller/reservasAdminController');

// Middleware de auth para todas
router.use(isAuthenticated, isAdminOrBibliotecario);

// GET /api/admin/reservas
router.get('/', reservasAdminController.listarReservas);

// POST /api/admin/reservas/:id/atender
router.post('/:id/atender', reservasAdminController.atenderReserva);

// POST /api/admin/reservas/:id/cancelar
router.post('/:id/cancelar', reservasAdminController.cancelarReserva);

// POST /api/admin/reservas/:id/concluir
router.post('/:id/concluir', reservasAdminController.concluirReserva);

// POST /api/admin/reservas/:id/renovar
router.post('/:id/renovar', reservasAdminController.renovarReserva);

module.exports = router;
