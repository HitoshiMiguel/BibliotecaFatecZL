// src/model/SolicitacaoModel.js

const pool = require('../config/db.js');

//Função para criar uma solicitação (AGORA INCLUI SENHA HASH)
async function createSolicitacao({ nome, email, perfil, senhaHash }) { // Adicionado senhaHash
    const sql =
    `
    INSERT INTO dg_solicitacoes_cadastro (nome, email, perfil_solicitado, status, senha_hash)
    VALUES (?, ?, ?, 'pendente', ?)
    `; // Adicionado placeholder para senha_hash

    const params = [
        nome,
        email,
        perfil,
        senhaHash // Passa o hash para a query
    ];

    try {
        const [result] = await pool.query(sql, params);
        console.log(`Solicitação criada para ${email} com hash.`);
        return result.insertId;
    } catch (error) {
        console.error(`Erro ao criar solicitação para ${email}:`, error);
        throw error; // Re-lança o erro para o controller tratar
    }
}

//Funções para o painel Admin

async function getAllPendentes() {
    const [rows] = await pool.query(
        'SELECT solicitacao_id, nome, email, perfil_solicitado, data_solicitacao, status FROM dg_solicitacoes_cadastro WHERE status = "pendente" ORDER BY data_solicitacao DESC' // Omite senha_hash da listagem
    );
    return rows;
}

// Busca solicitação por ID (incluindo senha_hash para o adminController)
async function findById(id) {
    if (!id) return null;
    const [rows] = await pool.query(
        'SELECT * FROM dg_solicitacoes_cadastro WHERE solicitacao_id = ?',
        [id]
    );
    return rows[0] || null;
}

async function updateStatus(id, novoStatus) {
    if (!id || !novoStatus) return 0;
    const [result] = await pool.query(
        'UPDATE dg_solicitacoes_cadastro SET status = ? WHERE solicitacao_id = ?',
        [novoStatus, id]
    );
    console.log(`Status da solicitação ${id} atualizado para ${novoStatus}. Linhas afetadas: ${result.affectedRows}`);
    return result.affectedRows;
}

// --- NOVA FUNÇÃO PARA EXCLUIR SOLICITAÇÃO POR EMAIL ---

/**
 * Exclui uma ou mais solicitações de cadastro associadas a um email.
 * Útil ao excluir um utilizador principal para limpar registos relacionados.
 * @param {string} email - O email do utilizador/solicitação a ser excluído.
 * @returns {number} O número de linhas de solicitação afetadas.
 */
async function deleteSolicitacaoByEmail(email) {
    if (!email) return 0; // Segurança básica

    const sql = 'DELETE FROM dg_solicitacoes_cadastro WHERE email = ?';
    try {
        const [result] = await pool.query(sql, [email]);
        console.log(`Tentativa de exclusão de solicitação para email ${email}. Linhas afetadas: ${result.affectedRows}`);
        return result.affectedRows;
    } catch (error) {
        console.error(`Erro ao excluir solicitação para email ${email}:`, error);
        // Retorna 0 em caso de erro, mas não quebra o fluxo principal de exclusão do utilizador
        return 0; 
    }
}


// --- EXPORTAÇÕES ATUALIZADAS ---
module.exports = {
    createSolicitacao,
    getAllPendentes,
    findById,
    updateStatus,
    deleteSolicitacaoByEmail, // <-- Nova função
};