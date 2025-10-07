const { DataTypes } = require('sequelize');
const pool = require('../infra/db/mysql/connection');

//busca um usuario pelo email dps retorna o objeto do banco ou null
async function findByEmail(email)
{
    const [rows] = await pool.query
    (
        'SELECT * FROM dg_usuarios WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0] || null;
}

//busca um usuário pelo RA 
async function findByRA(ra)
{
    if(!ra) return null;
    const [rows] = await pool.query
    (
        'SELECT * FROM dg_usuarios WHERE ra = ? LIMIT 1',
        [ra]
    );
    return rows[0] || null;
}

async function findById(id) {
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE usuario_id = ?',
        [id]
    );
    return rows[0] || null;
}

//cria usuário com perfil comum e retorna o insertId
async function createUser({nome, ra, email, senhaHash})
{
    const sql = 
    `
        INSERT INTO dg_usuarios (nome, ra, email, senha_hash, perfil)
        VALUES (?, ?, ?, ?, 'comum')
    `;
    const params = [nome, ra, email, senhaHash];
    const [result] = await pool.query(sql, params);
    return result.insertId;
}

module.exports = {findByEmail, findByRA, createUser, findById};