const mysql = require('mysql2/promise'); // 👈 IMPORTANTE: use 'mysql2/promise' para async/await
require('dotenv').config();

console.log('Inicializando pools de conexões...');

// ---------------------------------------------------------
// 1. POOL DO SISTEMA NOVO (Leitura e Escrita - Porta 3306)
// ---------------------------------------------------------
// Resolve usando variáveis específicas primeiro, e faz fallback para as variáveis "gerais" do .env
const poolSistemaNovo = mysql.createPool({
  host: process.env.DB_NEW_HOST || process.env.DB_HOST,
  user: process.env.DB_NEW_USER || process.env.DB_USER,
  password: process.env.DB_NEW_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_NEW_DATABASE || process.env.DB_NAME,
  port: process.env.DB_NEW_PORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ---------------------------------------------------------
// 2. POOL DO OPENBIBLIO (Legado/Leitura - Porta 3307)
// ---------------------------------------------------------
const poolOpenBiblio = mysql.createPool({
  host: process.env.DB_LEGACY_HOST,
  user: process.env.DB_LEGACY_USER,
  password: process.env.DB_LEGACY_PASSWORD,
  database: process.env.DB_LEGACY_DATABASE,
  port: process.env.DB_LEGACY_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'UTF8_GENERAL_CI' // Define o charset para evitar problemas com acentuação
});

// Log de diagnóstico (não imprime a senha)
console.log('Pools de conexões (Novo e Legado) configurados. Resolved configs:', {
  novo: {
    host: process.env.DB_NEW_HOST || process.env.DB_HOST,
    user: process.env.DB_NEW_USER || process.env.DB_USER,
    database: process.env.DB_NEW_DATABASE || process.env.DB_NAME,
    port: process.env.DB_NEW_PORT || process.env.DB_PORT || 3306
  },
  legado: {
    host: process.env.DB_LEGACY_HOST || process.env.DB_HOST,
    user: process.env.DB_LEGACY_USER || process.env.DB_USER,
    database: process.env.DB_LEGACY_DATABASE || process.env.DB_NAME,
    port: process.env.DB_LEGACY_PORT || process.env.DB_PORT || 3307
  }
});

// ✅ A MUDANÇA IMPORTANTE:
// Agora exportamos um OBJETO contendo as duas conexões.
// O 'poolSistemaNovo' substitui o seu antigo 'pool'.
module.exports = { 
    poolSistemaNovo, 
    poolOpenBiblio 
};