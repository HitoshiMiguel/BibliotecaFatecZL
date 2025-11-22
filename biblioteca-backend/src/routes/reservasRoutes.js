const express = require('express');
const router = express.Router();

// Importa o Controller
const reservasController = require('../controller/reservasController');

// Importa o Middleware correto (Desestruturando para pegar a função 'isAuthenticated')
const { isAuthenticated } = require('../middlewares/authMiddleware');

/**
 * ============================================================
 * ROTAS DE RESERVAS
 * ============================================================
 */

// 1. Rota para buscar livro atual (NOVA)
router.get('/usuario/atual', isAuthenticated, reservasController.getEmprestimoAtivo);

// 2. Listar minhas reservas
router.get('/minhas', isAuthenticated, reservasController.listarMinhasReservas);

// 3. Criar nova reserva
router.post('/', isAuthenticated, reservasController.criarReserva);

/**
 * ============================================================
 * ROTAS DE ADMIN / BIBLIOTECÁRIO
 * (Se precisar proteger com isAdmin ou isAdminOrBibliotecario,
 * importe e use aqui também)
 * ============================================================
 */

// Listar todas (Admin)
router.get('/', isAuthenticated, reservasController.listarTodasReservas);

// Atender reserva
router.patch('/:id/atender', isAuthenticated, reservasController.atenderReserva);

// Cancelar reserva
router.patch('/:id/cancelar', isAuthenticated, reservasController.cancelarReserva);

module.exports = router;