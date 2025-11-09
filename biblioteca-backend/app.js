// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Rotas / libs
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dbTestRoute = require('./src/routes/dbTestRoute');
const uploadRouter = require('./src/app/api/upload');
const googleRouter = require('./src/app/api/google');
const pool = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const moderationRouter = require('./src/app/api/moderation');
const { isAuthenticated } = require('./src/middlewares/authMiddleware');

const app = express();

/** ================================
 *  Middlewares globais
 *  ================================ */
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/** ================================
 *  Rotas da API (sempre antes dos handlers de erro)
 *  ================================ */
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', isAuthenticated, uploadRouter);
app.use('/api/google', googleRouter);
app.use('/db-test', dbTestRoute);

// Healthcheck simples
app.get('/', (_req, res) => {
  res.json({ message: 'API da Biblioteca Rodando!' });
});

// Verificação de conexão com o banco
app.get('/__dbcheck', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** ================================
 *  Handlers 404 e erros (sempre por último)
 *  ================================ */
app.use(notFound);
app.use(errorHandler);

/** ================================
 *  Start
 *  ================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API na porta ${PORT}`);
});

app.use('/api/moderation', moderationRouter);