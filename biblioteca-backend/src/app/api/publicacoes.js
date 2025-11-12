// src/app/api/publicacoes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controller/publicacoesController');

router.get('/publicacoes', ctrl.listarAprovadas);   // ?q=software&tipo=Livro
router.get('/publicacoes/:id', ctrl.detalharAprovada);

module.exports = router;
