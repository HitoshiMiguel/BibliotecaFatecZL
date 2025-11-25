// src/routes/submissoesRoutes.js
const express = require('express');
const router = express.Router();
const { listarMinhasSubmissoes } = require('../controller/submissoesController');

router.get('/minhas', listarMinhasSubmissoes);

module.exports = router;
