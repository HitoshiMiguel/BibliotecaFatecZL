const pool = require('../infra/db/mysql/connection');

function escapeLike(str = '') {
  return String(str).replace(/[\\%_]/g, s => '\\' + s);
}

const COLS = [
  'titulo_proposto', 'autor', 'editora',
  'conferencia', 'periodico', 'instituicao',
  'curso', 'descricao'
];

async function buscarAprovadas({ q = '', tipo = null, limit = 50, offset = 0 }) {
  const like = `%${escapeLike(q)}%`;
  const params = [];

  // [MODIFICADO] Adicionamos 's.' (submissoes) e 'i.' (itens_digitais)
  let sql = `
    SELECT 
      s.submissao_id, 
      i.item_id,         -- <--- AQUI ESTÁ A CORREÇÃO PRINCIPAL
      s.titulo_proposto, s.descricao, s.caminho_anexo, 
      s.autor, s.editora, s.ano_publicacao, s.conferencia, s.periodico, s.instituicao,
      s.orientador, s.curso, s.ano_defesa, s.tipo, s.data_submissao
    FROM dg_submissoes s  -- <--- alias 's'
    
    -- [NOVO] Faz o JOIN com a tabela de itens
    -- Assumindo que a ligação é feita por 'submissao_id'
    LEFT JOIN dg_itens_digitais i ON s.submissao_id = i.submissao_id 
    
    WHERE s.status = 'aprovado'
  `;

  if (q) {
    // [MODIFICADO] Adiciona 's.' em todas as colunas de busca para evitar ambiguidade
    sql += ` AND ( ${COLS.map(c => `s.${c} LIKE ?`).join(' OR ')} )`;
    params.push(...Array(COLS.length).fill(like));
  }
  if (tipo) {
    // [MODIFICADO] Adiciona 's.'
    sql += ` AND s.tipo = ?`;
    params.push(tipo);
  }

  // [MODIFICADO] Adiciona 's.'
  sql += ` ORDER BY COALESCE(s.ano_publicacao, 0) DESC, s.data_submissao DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function buscarAprovadaPorId(id) {
  // [MODIFICADO] Também corrigimos esta função, adicionando o JOIN e o 'item_id'
  const [rows] = await pool.query(
    `
    SELECT 
      s.submissao_id, 
      i.item_id,         -- <--- AQUI ESTÁ A CORREÇÃO PRINCIPAL
      s.titulo_proposto, s.descricao, s.caminho_anexo, 
      s.autor, s.editora, s.ano_publicacao, s.conferencia, s.periodico, s.instituicao,
      s.orientador, s.curso, s.ano_defesa, s.tipo, s.data_submissao
    FROM dg_submissoes s
    LEFT JOIN dg_itens_digitais i ON s.submissao_id = i.submissao_id
    WHERE s.submissao_id = ? AND s.status = 'aprovado'
    `,
    [id]
  );
  return rows[0] || null;
}

module.exports = { buscarAprovadas, buscarAprovadaPorId };