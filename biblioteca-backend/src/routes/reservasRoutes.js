// src/routes/reservasRoutes.js
const express = require('express');
const router = express.Router();

const reservasController = require('../controller/reservasController');
const {
  isAuthenticated,
  isAdminOrBibliotecario,
} = require('../middlewares/authMiddleware');

// Usuário logado cria reserva e vê as dele
router.post('/', isAuthenticated, reservasController.criarReserva);
router.get('/minhas', isAuthenticated, reservasController.listarMinhasReservas);

// Bibliotecário/Admin gerencia reservas
router.get(
  '/admin',
  isAuthenticated,
  isAdminOrBibliotecario,
  reservasController.listarTodasReservas
);

router.post(
  '/admin/:id/atender',
  isAuthenticated,
  isAdminOrBibliotecario,
  reservasController.atenderReserva
);

router.post(
  '/admin/:id/cancelar',
  isAuthenticated,
  isAdminOrBibliotecario,
  reservasController.cancelarReserva
);

module.exports = router;
