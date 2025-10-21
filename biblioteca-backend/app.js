// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');

// --- CORS ---
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// --- PARSERS ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- ROTAS API ---
app.use('/api', require('./src/routes/authRoutes'));

// --- PLACEHOLDER SIMPLES (independente do DB) ---
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// --- DB CHECK (depende do DB) ---
const pool = require('./src/config/db');
app.get('/__dbcheck', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- START ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});
