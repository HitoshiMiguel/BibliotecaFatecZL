// routes/health.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/db', async (req, res) => {
  try {
    const start = Date.now();
    const [rows] = await pool.query('SELECT 1 AS ok');
    const ms = Date.now() - start;

    return res.status(200).json({
      ok: true,
      db: rows?.[0]?.ok === 1,
      latency_ms: ms,
      message: 'DB reachable',
    });
  } catch (err) {
    console.error('[HEALTH /db]', err);
    return res.status(500).json({
      ok: false,
      db: false,
      message: 'DB unreachable',
      error: err.message,
    });
  }
});

module.exports = router;
