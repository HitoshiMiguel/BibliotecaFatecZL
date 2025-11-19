// src/model/UserModel.js

const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');
// --- FUNÇÕES PARA ATIVAÇÃO DE CONTA (Professor define senha) ---

/**
 * Encontra um utilizador pelo token de ativação E status pendente.
 */
async function findByActivationToken(token) { // Versão que verifica o status
    if (!token) return null;
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE token_ativacao = ? AND status_conta = "pendente_ativacao" LIMIT 1',
        [token]
    );
    return rows[0] || null;
}

/**
 * Define o hash da senha, limpa o token de ativação e muda status para 'ativa'.
 */
async function activateUserAccount(id, senhaHash) { // Versão que define senha e status
    if (!id || !senhaHash) return;
    await pool.query(
        'UPDATE dg_usuarios SET senha_hash = ?, token_ativacao = NULL, status_conta = "ativa" WHERE usuario_id = ?',
        [senhaHash, id]
    );
}

// ------------------------------------------------------------------
// --- FUNÇÕES DE BUSCA ---
// ------------------------------------------------------------------

/**
 * Busca um utilizador pelo email.
 */
async function findByEmail(email) {
    if (!email) return null;
    const [rows] = await pool.query('SELECT * FROM dg_usuarios WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
}

/**
 * Busca um utilizador pelo RA.
 */
async function findByRA(ra) {
    if (!ra) return null;
    const [rows] = await pool.query('SELECT * FROM dg_usuarios WHERE ra = ? LIMIT 1', [ra]);
    return rows[0] || null;
}

/**
 * Busca um utilizador pelo ID.
 */
async function findById(id) {
    if (!id) return null;
    const [rows] = await pool.query('SELECT * FROM dg_usuarios WHERE usuario_id = ?', [id]);
    return rows[0] || null;
}

/**
 * Busca todos os utilizadores registados (sem senha).
 */
async function getAllUsers() {
    const sql = `
        SELECT
            usuario_id, nome, ra, email, perfil, status_conta
        FROM dg_usuarios
        ORDER BY nome ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
}


// ------------------------------------------------------------------
// --- CRUD - CREATE ---
// ------------------------------------------------------------------

/**
 * Insere um utilizador completo no banco de dados.
 */
async function insertUser(usuario) {
    // ... (código como antes, com logs e tratamento de null/undefined)
    console.log("DEBUG UserModel.insertUser - Objeto Recebido:", usuario);
    const sql = `INSERT INTO dg_usuarios (nome, ra, email, senha_hash, perfil, token_ativacao, status_conta) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        usuario.nome,
        usuario.ra !== undefined && usuario.ra !== null ? usuario.ra : null,
        usuario.email,
        usuario.senha_hash !== undefined && usuario.senha_hash !== null ? usuario.senha_hash : null,
        usuario.perfil,
        usuario.token_ativacao !== undefined && usuario.token_ativacao !== null ? usuario.token_ativacao : null,
        usuario.status_conta
    ];
    console.log("DEBUG UserModel.insertUser - Parâmetros:", params);
    if (params[6] === undefined || params[6] === null) {
        throw new Error("Valor inválido para status_conta detectado antes da inserção.");
    }
    const [result] = await pool.query(sql, params);
    return result.insertId;
}

// ------------------------------------------------------------------
// --- CRUD - UPDATE ---
// ------------------------------------------------------------------

/**
 * Atualiza os dados de um utilizador específico (exceto senha).
 */
async function updateUserById(id, userData) {
    const fieldsToUpdate = [];
    const params = [];
    const allowedFields = ['nome', 'email', 'ra', 'perfil', 'status_conta'];

    allowedFields.forEach(field => {
        if (userData[field] !== undefined) {
             if (field === 'ra' && userData[field] === '') {
                 fieldsToUpdate.push(`${field} = ?`);
                 params.push(null);
             } else {
                 fieldsToUpdate.push(`${field} = ?`);
                 params.push(userData[field]);
             }
        }
    });

    if (fieldsToUpdate.length === 0) return 0;
    params.push(id);
    const sql = `UPDATE dg_usuarios SET ${fieldsToUpdate.join(', ')} WHERE usuario_id = ?`;
    console.log("DEBUG updateUserById - SQL:", sql);
    console.log("DEBUG updateUserById - Params:", params);
    const [result] = await pool.query(sql, params);
    return result.affectedRows;
}

// ------------------------------------------------------------------
// --- CRUD - DELETE ---
// ------------------------------------------------------------------

/**
 * Exclui um utilizador do banco de dados.
 */
async function deleteUserById(id) {
    if (!id) return 0;
    const sql = 'DELETE FROM dg_usuarios WHERE usuario_id = ?';
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows;
}
// ------------------------------------------------------------------
// --- FUNÇÕES DE REDEFINIÇÃO DE SENHA ---
// ------------------------------------------------------------------

/**
 * Busca o utilizador pelo token de redefinição e verifica a validade.
 * @param {string} token - O token de redefinição.
 * @returns {object|null} O utilizador se o token for válido e não expirado.
 */
async function findByResetToken(token) {
    if (!token) return null;
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
        [token]
    );
    return rows[0] || null;
}

/**
 * Atualiza o token e a data de expiração para o fluxo de redefinição.
 * @param {number} id - O ID do utilizador.
 * @param {string} token - O novo token de redefinição.
 * @param {Date} expira - A data de expiração do token.
 */
async function updateResetToken(id, token, expira) {
    if (!id || !token || !expira) return; // Adiciona verificação básica
    await pool.query(
        'UPDATE dg_usuarios SET reset_token = ?, reset_token_expira = ? WHERE usuario_id = ?',
        [token, expira, id]
    );
}

/**
 * Atualiza o hash da senha e limpa os campos de token após a redefinição.
 * @param {number} id - O ID do utilizador.
 * @param {string} senhaHash - O novo hash da senha.
 */
async function updatePassword(id, senhaHash) {
    if (!id || !senhaHash) return; // Adiciona verificação básica
    await pool.query(
        'UPDATE dg_usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE usuario_id = ?',
        [senhaHash, id]
    );
}

// ------------------------------------------------------------------
// --- FUNÇÕES PARA ATIVAÇÃO/CONFIRMAÇÃO DE CONTA ---
// ------------------------------------------------------------------

/**
 * Encontra um utilizador pelo seu token de ativação (usado para confirmação).
 * @param {string} token - O token de ativação/confirmação.
 * @returns {object|null} O utilizador se encontrado.
 */
async function findByActivationTokenSimplified(token) {
    if (!token) return null;
    const [rows] = await pool.query(
        'SELECT * FROM dg_usuarios WHERE token_ativacao = ? LIMIT 1',
        [token]
    );
    return rows[0] || null;
}

/**
 * Limpa o token de ativação de um utilizador após a confirmação.
 * @param {number} id - O ID do utilizador.
 */
async function clearActivationToken(id) {
    if (!id) return; // Adiciona verificação básica
    await pool.query(
        'UPDATE dg_usuarios SET token_ativacao = NULL WHERE usuario_id = ?',
        [id]
    );
}

// --- FUNÇÃO PARA ATUALIZAÇÃO DE PERFIL PELO PRÓPRIO UTILIZADOR ---

/**
 * Atualiza campos específicos do perfil do utilizador (nome, email).
 * @param {number} id - O ID do utilizador (obtido do token).
 * @param {object} profileData - Objeto contendo { nome?, email? }.
 * @returns {number} Número de linhas afetadas.
 */
async function updateUserProfile(id, profileData) {
    const fieldsToUpdate = [];
    const params = [];

    // Campos permitidos para auto-atualização
    if (profileData.nome !== undefined) {
        fieldsToUpdate.push('nome = ?');
        params.push(profileData.nome);
    }
    if (profileData.email !== undefined) {
        fieldsToUpdate.push('email = ?');
        params.push(profileData.email);
    }
    // Adicionar outros campos permitidos aqui se necessário

    if (fieldsToUpdate.length === 0) {
        return 0; // Nada a atualizar
    }

    params.push(id); // Adiciona o ID para a cláusula WHERE

    const sql = `UPDATE dg_usuarios SET ${fieldsToUpdate.join(', ')} WHERE usuario_id = ?`;

    console.log("DEBUG updateUserProfile - SQL:", sql);
    console.log("DEBUG updateUserProfile - Params:", params);

    const [result] = await pool.query(sql, params);
    return result.affectedRows;
}


// --- EXPORTAÇÕES ---
module.exports = {
    // Busca
    findByEmail,
    findByRA,
    findById,
    findByResetToken,
    findByActivationTokenSimplified,
    getAllUsers,
    findByActivationToken,
    activateUserAccount,
    updateUserProfile, // <--- GARANTIR QUE ESTÁ AQUI

    // Criação
    insertUser,

    // Atualização
    updateUserById,
    updateResetToken,
    updatePassword,
    clearActivationToken,

    // Exclusão
    deleteUserById,
};