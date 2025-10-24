// src/model/SolicitacaoModel.js

const pool = require('../config/db.js');
// REMOVEMOS: const { findById } = require('./UserModel'); 

//Função para criar uma solicitação na tabela de solicitações de cadastro
async function createSolicitacao({ nome, email, perfil }) {
    const sql =
    `
    INSERT INTO dg_solicitacoes_cadastro (nome, email, perfil_solicitado, status)
    VALUES (?, ?, ?, 'pendente')
    `;

    const params = [
        nome,
        email,
        perfil
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
}

//Funções para o painel Admin

async function getAllPendentes() {
    const [rows] = await pool.query(
        'SELECT * FROM dg_solicitacoes_cadastro WHERE status = "pendente"'
    );
    return rows;
}

// Implementação CORRETA do findById para a tabela de SOLICITAÇÕES
async function findById(id) {
    const [rows] = await pool.query(
        'SELECT * FROM dg_solicitacoes_cadastro WHERE solicitacao_id = ?', // <--- CORRIGIDO
        [id]
    );
    // Retorna o primeiro resultado ou null
    return rows[0] || null; 
}

async function updateStatus(id, novoStatus) {
    const [result] = await pool.query(
        'UPDATE dg_solicitacoes_cadastro SET status = ? WHERE solicitacao_id = ?',
        [novoStatus, id]
    );
    return result.affectedRows;
}

module.exports = {
    createSolicitacao,
    getAllPendentes,
    findById, // <--- AGORA EXPORTA A FUNÇÃO CORRETA ACIMA
    updateStatus
}
