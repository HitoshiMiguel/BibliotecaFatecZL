// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

/**
 * Rotas administrativas (placeholder)
 * Exemplo: GET /api/admin/ping
 */
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'admin' });
});

module.exports = router;
