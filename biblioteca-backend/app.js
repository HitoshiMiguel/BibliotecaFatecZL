// app.js (Versão Otimizada)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// --- Importação das Rotas ---
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const pool = require('./src/config/db'); // Para o DB check

// --- Middlewares Globais (Definidos ANTES das rotas) ---

// 1. CORS (Permite requisições do frontend com cookies)
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// 2. Parsers (Apenas uma vez)
app.use(express.json()); // Equivalente ao bodyParser.json()
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Montagem das Rotas API ---
app.use('/api/auth', authRoutes);   // Rotas em /api/auth/...
app.use('/api/admin', adminRoutes); // Rotas em /api/admin/...

// --- Rotas de Verificação ---

// Rota raiz simples
app.get('/', (req, res) => {
    res.json({ message: "API da Biblioteca Rodando!" });
});

// Rota de verificação do banco de dados
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