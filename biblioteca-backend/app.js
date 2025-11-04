// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const dbTestRoute = require('./src/routes/dbTestRoute');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

<<<<<<< Updated upstream
// CORS / parsers
=======
// --- Importação das Rotas ---
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const uploadRouter = require('./src/app/api/upload'); // ✅ AQUI (CommonJS)
const pool = require('./src/config/db'); // Para o DB check

// --- Middlewares Globais ---
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

<<<<<<< Updated upstream
// ROTAS (sempre antes do 404/erros)
app.use('/api', authRoutes);
app.use('/db-test', dbTestRoute);
app.get('/__dbcheck', (req, res) => res.redirect(307, '/db-test'));

// 404 e erros (sempre por último)
app.use(notFound);
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API na porta ${PORT}`));
=======
// --- Montagem das Rotas API ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRouter); // ✅ registra ANTES do listen

// --- Rotas de Verificação ---
app.get('/', (req, res) => {
  res.json({ message: "API da Biblioteca Rodando!" });
});

app.get('/__dbcheck', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
