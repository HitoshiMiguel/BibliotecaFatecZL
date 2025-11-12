const pool = require('../infra/db/mysql/connection'); // corrigido caminho

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
  let sql = `
    SELECT 
      submissao_id, titulo_proposto, descricao, caminho_anexo, 
      autor, editora, ano_publicacao, conferencia, periodico, instituicao,
      orientador, curso, ano_defesa, tipo, data_submissao
    FROM dg_submissoes
    WHERE status = 'aprovado'
  `;

  if (q) {
    sql += ` AND ( ${COLS.map(c => `${c} LIKE ?`).join(' OR ')} )`;
    params.push(...Array(COLS.length).fill(like));
  }
  if (tipo) {
    sql += ` AND tipo = ?`;
    params.push(tipo);
  }

  sql += ` ORDER BY COALESCE(ano_publicacao, 0) DESC, data_submissao DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function buscarAprovadaPorId(id) {
  const [rows] = await pool.query(
    `
    SELECT 
      submissao_id, titulo_proposto, descricao, caminho_anexo, 
      autor, editora, ano_publicacao, conferencia, periodico, instituicao,
      orientador, curso, ano_defesa, tipo, data_submissao
    FROM dg_submissoes
    WHERE submissao_id = ? AND status = 'aprovado'
    `,
    [id]
  );
  return rows[0] || null;
}

module.exports = { buscarAprovadas, buscarAprovadaPorId };
