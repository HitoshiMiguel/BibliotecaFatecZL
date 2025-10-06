const mysql = require('mysql2/promise'); // 👈 IMPORTANTE: use 'mysql2/promise' para async/await

console.log('Criando pool de conexões...');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Pool de conexões criado com sucesso.');

// ✅ A LINHA MAIS IMPORTANTE:
// Exporta diretamente o objeto 'pool' que tem a função .query()
module.exports = pool;