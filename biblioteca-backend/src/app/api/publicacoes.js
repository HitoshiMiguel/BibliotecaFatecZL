const express = require('express');
const router = express.Router();
const ctrl = require('../../controller/publicacoesController');

// 1. Listagem geral
router.get('/publicacoes', ctrl.listarAprovadas);

// 2. NOVA ROTA DE CAPA (Deve vir ANTES do :id)
// Se colocar depois, o express acha que "capa" é um ID
router.get('/publicacoes/capa/:id', ctrl.obterCapaPublicacao);

// 3. Detalhes por ID (Genérica - Fica por último)
router.get('/publicacoes/:id', ctrl.detalharAprovada);

module.exports = router;