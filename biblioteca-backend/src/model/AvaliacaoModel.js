// src/model/AvaliacaoModel.js
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

/**
 * Busca todas as avaliações de um item/publicação
 */
async function getAvaliacoesByItem(itemId) {
  if (!itemId) return { rows: [], average: 0, count: 0 };
  
  const [rows] = await pool.query(
    'SELECT * FROM dg_avaliacoes WHERE item_id = ? ORDER BY data_avaliacao DESC',
    [itemId]
  );
  
  if (rows.length === 0) return { rows: [], average: 0, count: 0 };
  
  const average = (rows.reduce((sum, r) => sum + r.nota, 0) / rows.length).toFixed(1);
  const count = rows.length;
  
  return { rows, average: parseFloat(average), count };
}

/**
 * Busca a avaliação de um usuário para um item
 */
async function getAvaliacaoByUserAndItem(usuarioId, itemId) {
  if (!usuarioId || !itemId) return null;
  
  const [rows] = await pool.query(
    'SELECT * FROM dg_avaliacoes WHERE usuario_id = ? AND item_id = ? LIMIT 1',
    [usuarioId, itemId]
  );
  
  return rows[0] || null;
}

/**
 * Cria ou atualiza uma avaliação
 */
async function saveAvaliacao(usuarioId, itemId, nota) {
  if (!usuarioId || !itemId || !nota) {
    throw new Error('usuarioId, itemId e nota são obrigatórios');
  }
  
  if (nota < 1 || nota > 5) {
    throw new Error('nota deve estar entre 1 e 5');
  }
  
  // Tenta atualizar; se não encontrar linhas, faz INSERT
  const [result] = await pool.query(
    `INSERT INTO dg_avaliacoes (usuario_id, item_id, nota) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nota = VALUES(nota), data_avaliacao = NOW()`,
    [usuarioId, itemId, nota]
  );
  
  return result;
}

/**
 * Deleta uma avaliação
 */
async function deleteAvaliacao(usuarioId, itemId) {
  if (!usuarioId || !itemId) return 0;
  
  const [result] = await pool.query(
    'DELETE FROM dg_avaliacoes WHERE usuario_id = ? AND item_id = ?',
    [usuarioId, itemId]
  );
  
  return result.affectedRows;
}

module.exports = {
  getAvaliacoesByItem,
  getAvaliacaoByUserAndItem,
  saveAvaliacao,
  deleteAvaliacao
};
