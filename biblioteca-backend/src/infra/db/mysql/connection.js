const mysql = require('mysql2/promise'); // 👈 IMPORTANTE: use 'mysql2/promise' para async/await
require('dotenv').config();

console.log('Inicializando pools de conexões...');

// ---------------------------------------------------------
// 1. POOL DO SISTEMA NOVO (Leitura e Escrita - Porta 3306)
// ---------------------------------------------------------
const poolSistemaNovo = mysql.createPool({
  host: process.env.DB_NEW_HOST,
  user: process.env.DB_NEW_USER,
  password: process.env.DB_NEW_PASSWORD,
  database: process.env.DB_NEW_DATABASE,
  port: process.env.DB_NEW_PORT || 3306,
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

console.log('Pools de conexões (Novo e Legado) configurados.');

// ✅ A MUDANÇA IMPORTANTE:
// Agora exportamos um OBJETO contendo as duas conexões.
// O 'poolSistemaNovo' substitui o seu antigo 'pool'.
module.exports = { 
    poolSistemaNovo, 
    poolOpenBiblio 
};