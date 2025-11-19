// src/routes/dbTestRoute.js
const router = require('express').Router();
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

router.get('/', async (req, res, next) => {
  const startedAt = Date.now();
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    const ok = rows?.[0]?.ok === 1;
    res.status(ok ? 200 : 500).json({
      ok,
      data: {
        db: {
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          user: process.env.DB_USER,
        },
        latencyMs: Date.now() - startedAt,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (err) {
    err.type = err.type || 'DB_CONN_ERROR';
    err.status = err.status || 500;
    next(err);
  }
});

module.exports = router;
