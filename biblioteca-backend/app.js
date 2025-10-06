// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
// --- CONFIGURAÇÃO DE MIDDLEWARE ---

// Configuração do CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

// Middlewares para entender JSON e dados de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// --- ROTAS DA API ---

// Conecta o arquivo de rotas de autenticação
// Todas as rotas definidas em 'authRoutes.js' começarão com /api
app.use('/api', require('./src/routes/authRoutes')); 

// --- ROTA DE TESTE (Opcional) ---
const pool = require('./src/config/db'); // Mova a importação do pool para onde for usada
app.get('/__dbcheck', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- INICIAR O SERVIDOR ---
const PORT = process.env.PORT || 4000; // Sugiro usar outra porta (ex: 4000) para não conflitar com o Next.js (3000)
app.listen(PORT, () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});