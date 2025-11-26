const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

/**
 * Helper para limpar o ID (remove 'LEGACY_' se existir)
 */
function cleanId(id) {
  if (!id) return null;
  // Transforma em string, remove 'LEGACY_' e converte para número
  const cleanString = String(id).replace('LEGACY_', '');
  const number = parseInt(cleanString, 10);
  return isNaN(number) ? null : number;
}

/**
 * Helper para definir qual coluna usar baseado no tipo
 */
function getColunas(tipo) {
  if (tipo === 'fisico') {
    return { idCol: 'biblio_id', tipoVal: 'fisico' };
  }
  return { idCol: 'item_id', tipoVal: 'digital' };
}

/**
 * Busca todas as avaliações de um item/publicação
 */
async function getAvaliacoesByItem(rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!id) return { rows: [], average: 0, count: 0 };
  
  const { idCol, tipoVal } = getColunas(tipo);

  const [rows] = await pool.query(
    `SELECT * FROM dg_avaliacoes WHERE ${idCol} = ? AND tipo_item = ? ORDER BY data_avaliacao DESC`,
    [id, tipoVal]
  );
  
  if (rows.length === 0) return { rows: [], average: 0, count: 0 };
  
  const average = (rows.reduce((sum, r) => sum + r.nota, 0) / rows.length).toFixed(1);
  const count = rows.length;
  
  return { rows, average: parseFloat(average), count };
}

/**
 * Busca a avaliação de um usuário para um item
 */
async function getAvaliacaoByUserAndItem(usuarioId, rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!usuarioId || !id) return null;

  const { idCol, tipoVal } = getColunas(tipo);
  
  const [rows] = await pool.query(
    `SELECT * FROM dg_avaliacoes WHERE usuario_id = ? AND ${idCol} = ? AND tipo_item = ? LIMIT 1`,
    [usuarioId, id, tipoVal]
  );
  
  return rows[0] || null;
}

/**
 * Cria ou atualiza uma avaliação
 */
async function saveAvaliacao(usuarioId, rawId, nota, tipo = 'digital') {
  const id = cleanId(rawId);
  
  if (!usuarioId || !id || !nota) {
    throw new Error('usuarioId, id e nota são obrigatórios');
  }
  
  if (nota < 1 || nota > 5) {
    throw new Error('nota deve estar entre 1 e 5');
  }

  const { idCol, tipoVal } = getColunas(tipo);

  // 1. Verifica se já existe avaliação deste usuário para este item
  const existing = await getAvaliacaoByUserAndItem(usuarioId, id, tipo);

  let result;

  if (existing) {
    // UPDATE
    [result] = await pool.query(
      `UPDATE dg_avaliacoes SET nota = ?, data_avaliacao = NOW() 
       WHERE usuario_id = ? AND ${idCol} = ? AND tipo_item = ?`,
      [nota, usuarioId, id, tipoVal]
    );
  } else {
    // INSERT
    // Define qual campo recebe o ID e qual recebe NULL
    const campoDigital = tipo === 'digital' ? id : null;
    const campoFisico  = tipo === 'fisico'  ? id : null;

    [result] = await pool.query(
      `INSERT INTO dg_avaliacoes (usuario_id, item_id, biblio_id, tipo_item, nota, data_avaliacao) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [usuarioId, campoDigital, campoFisico, tipoVal, nota]
    );
  }
  
  return result;
}

/**
 * Deleta uma avaliação
 */
async function deleteAvaliacao(usuarioId, rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!usuarioId || !id) return 0;

  const { idCol, tipoVal } = getColunas(tipo);
  
  const [result] = await pool.query(
    `DELETE FROM dg_avaliacoes WHERE usuario_id = ? AND ${idCol} = ? AND tipo_item = ?`,
    [usuarioId, id, tipoVal]
  );
  
  return result.affectedRows;
}

module.exports = {
  getAvaliacoesByItem,
  getAvaliacaoByUserAndItem,
  saveAvaliacao,
  deleteAvaliacao
};