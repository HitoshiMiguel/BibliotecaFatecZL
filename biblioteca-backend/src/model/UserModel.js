// src/model/UserModel.js

const pool = require('../config/db.js');

// ------------------------------------------------------------------
// --- FUNÇÕES DE BUSCA ---
// ------------------------------------------------------------------

// Busca um usuário pelo email
async function findByEmail(email)
{
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0] || null;
}

// Busca um usuário pelo RA
async function findByRA(ra)
{
    if(!ra) return null;
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE ra = ? LIMIT 1',
        [ra]
    );
    return rows[0] || null;
}

// Busca um usuário pelo ID
async function findById(id) {
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE usuario_id = ?',
        [id]
    );
    return rows[0] || null;
}

// ------------------------------------------------------------------
// --- CRUD GERAL (USADO PELO BUILDER) ---
// ------------------------------------------------------------------

// Insere um usuário completo (usado pelo Builder)
async function insertUser(usuario)
{
    const sql = 
    `
        INSERT INTO dg_usuarios (
            nome, ra, email, senha_hash, perfil, token_ativacao, status_conta
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Garantimos que todos os campos (7) estejam na lista, usando NULL para opcionais
    const params = [
        usuario.nome, 
        usuario.ra || null, 
        usuario.email, 
        usuario.senha_hash || null, // Pode ser NULL para contas pendentes de ativação
        usuario.perfil,
        usuario.token_ativacao || null,
        usuario.status_conta || 'ativa' // Garante que o NOT NULL do DB seja respeitado
    ];
    
    const [result] = await pool.query(sql, params);
    return result.insertId;
}

// ------------------------------------------------------------------
// --- FUNÇÕES DE REDEFINIÇÃO DE SENHA (CORREÇÃO DO PROBLEMA) ---
// ------------------------------------------------------------------

/**
 * Busca o usuário pelo token de redefinição e verifica a validade.
 * @param {string} token - O token de redefinição.
 * @returns {object|null} O usuário se o token for válido e não expirado.
 */
async function findByResetToken(token) {
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
        [token]
    );
    return rows[0] || null;
}

/**
 * Atualiza o token e a data de expiração para o fluxo de redefinição.
 */
async function updateResetToken(id, token, expira) {
    await pool.query(
        'UPDATE dg_usuarios SET reset_token = ?, reset_token_expira = ? WHERE usuario_id = ?',
        [token, expira, id]
    );
}

/**
 * Atualiza o hash da senha e limpa os campos de token após a redefinição.
 */
async function updatePassword(id, senhaHash) {
    await pool.query(
        'UPDATE dg_usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE usuario_id = ?',
        [senhaHash, id]
    );
}


module.exports = {
    findByEmail,
    findByRA,
    findById,
    insertUser,
    // EXPORTAÇÕES CORRIGIDAS
    findByResetToken,
    updateResetToken,
    updatePassword,
};