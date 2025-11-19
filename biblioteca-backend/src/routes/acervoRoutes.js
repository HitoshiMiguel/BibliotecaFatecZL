// src/routes/acervoRoutes.js
const express = require('express');
const router = express.Router();
const acervoController = require('../controller/AcervoController');

// Rota: GET /api/acervo/buscar?q=Termo
router.get('/buscar', acervoController.buscarLivros);

module.exports = router;