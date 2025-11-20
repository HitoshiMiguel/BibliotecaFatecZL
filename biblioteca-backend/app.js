require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ================================
// Rotas / libs
// ================================
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dbTestRoute = require('./src/routes/dbTestRoute');
const uploadRouter = require('./src/app/api/upload');
const googleRouter = require('./src/app/api/google');
const moderationRouter = require('./src/app/api/moderation');
const publicacoes = require('./src/app/api/publicacoes'); // nova rota de consulta de publicações
const pool = require('./src/config/db');
const acervoRoutes = require('./src/routes/acervoRoutes');

// --- NOVO (No caminho certo) ---
const favoritoRoutes = require('./src/routes/FavoritoRoutes'); 

// --- Caminhos que já estavam corretos ---
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const { isAuthenticated } = require('./src/middlewares/authMiddleware');

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/** ================================
 *  Middlewares globais
 *  ================================ */
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/** ================================
 *  Rotas principais da API
 *  ================================ */
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', isAuthenticated, uploadRouter);
app.use('/api/google', googleRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api', publicacoes); // <— monta /api/publicacoes e /api/publicacoes/:id
app.use('/db-test', dbTestRoute);

// --- NOVO (Registrando a rota) ---
app.use('/api/favoritos', favoritoRoutes);

app.use('/api/acervo', acervoRoutes);


/** ================================
 *  Healthcheck e diagnóstico
 *  ================================ */
app.get('/', (_req, res) => {
    res.json({ message: 'API da Biblioteca Rodando!' });
});

app.get('/__dbcheck', async (_req, res) => {
    try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows?.[0]?.ok === 1 });
    } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
    }
});

/** ================================
 *  Handlers de erro (sempre por último)
 *  ================================ */
app.use(notFound);
app.use(errorHandler);

/** ================================
 *  Inicialização do servidor
 *  ================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API da Biblioteca rodando na porta ${PORT}`);
});