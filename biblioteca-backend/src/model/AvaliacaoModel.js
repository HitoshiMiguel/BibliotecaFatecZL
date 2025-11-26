const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

function cleanId(id) {
  if (!id) return null;
  const cleanString = String(id).replace('LEGACY_', '');
  const number = parseInt(cleanString, 10);
  return isNaN(number) ? null : number;
}

// Helper para saber qual coluna preencher
function getColunas(tipo) {
  // Se o frontend mandar 'fisico', usamos biblio_id. Se não, item_id.
  if (tipo === 'fisico') {
    return { alvo: 'biblio_id', oposto: 'item_id' };
  }
  return { alvo: 'item_id', oposto: 'biblio_id' };
}

async function getAvaliacoesByItem(rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!id) return { rows: [], average: 0, count: 0 };
  
  const { alvo } = getColunas(tipo);

  // Busca onde a coluna certa (item_id ou biblio_id) tem o ID
  const [rows] = await pool.query(
    `SELECT * FROM dg_avaliacoes WHERE ${alvo} = ? ORDER BY data_avaliacao DESC`,
    [id]
  );
  
  if (rows.length === 0) return { rows: [], average: 0, count: 0 };
  
  const average = (rows.reduce((sum, r) => sum + r.nota, 0) / rows.length).toFixed(1);
  const count = rows.length;
  
  return { rows, average: parseFloat(average), count };
}

async function getAvaliacaoByUserAndItem(usuarioId, rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!usuarioId || !id) return null;

  const { alvo } = getColunas(tipo);

  const [rows] = await pool.query(
    `SELECT * FROM dg_avaliacoes WHERE usuario_id = ? AND ${alvo} = ? LIMIT 1`,
    [usuarioId, id]
  );
  
  return rows[0] || null;
}

async function saveAvaliacao(usuarioId, rawId, nota, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!usuarioId || !id || !nota) throw new Error('Dados incompletos');

  const { alvo, oposto } = getColunas(tipo);

  // Verifica se já existe avaliação desse usuário para esse item específico
  const existing = await getAvaliacaoByUserAndItem(usuarioId, id, tipo);

  let result;

  if (existing) {
    // UPDATE
    [result] = await pool.query(
      `UPDATE dg_avaliacoes SET nota = ?, data_avaliacao = NOW() 
       WHERE usuario_id = ? AND ${alvo} = ?`,
      [nota, usuarioId, id]
    );
  } else {
    // INSERT
    // Aqui está o pulo do gato: Gravamos o ID na coluna alvo e NULL na oposta
    // Ex: Se for físico -> item_id = NULL, biblio_id = 500
    [result] = await pool.query(
      `INSERT INTO dg_avaliacoes (usuario_id, ${alvo}, ${oposto}, nota, data_avaliacao) 
       VALUES (?, ?, NULL, ?, NOW())`,
      [usuarioId, id, nota]
    );
  }
  
  return result;
}

async function deleteAvaliacao(usuarioId, rawId, tipo = 'digital') {
  const id = cleanId(rawId);
  if (!usuarioId || !id) return 0;

  const { alvo } = getColunas(tipo);

  const [result] = await pool.query(
    `DELETE FROM dg_avaliacoes WHERE usuario_id = ? AND ${alvo} = ?`,
    [usuarioId, id]
  );
  
  return result.affectedRows;
}

module.exports = {
  getAvaliacoesByItem,
  getAvaliacaoByUserAndItem,
  saveAvaliacao,
  deleteAvaliacao
};