// src/services/publicacoesService.js

// 1. Importamos a conexão do novo e o serviço do legado
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');
const acervoLegadoService = require('./AcervoLegadoService');

function escapeLike(str = '') {
  return String(str).replace(/[\\%_]/g, (s) => '\\' + s);
}

const COLS = [
  'titulo_proposto',
  'autor',
  'editora',
  'conferencia',
  'periodico',
  'instituicao',
  'curso',
  'descricao',
];

/**
 * Lista publicações aprovadas (digital + físico legado)
 */
async function buscarAprovadas({ q = '', tipo = null, limit = 50, offset = 0 }) {
  // --- PARTE 1: BUSCA NO ACERVO DIGITAL (CÓDIGO ORIGINAL) ---
  const like = `%${escapeLike(q)}%`;
  const params = [];

  let sql = `
    SELECT 
      s.submissao_id, 
      i.item_id,
      s.titulo_proposto, s.descricao, s.caminho_anexo, 
      s.autor, s.editora, s.ano_publicacao, s.conferencia, s.periodico, s.instituicao,
      s.orientador, s.curso, s.ano_defesa, s.tipo, s.data_submissao,
      'DIGITAL' as origem  -- Marcamos que veio do digital
    FROM dg_submissoes s 
    LEFT JOIN dg_itens_digitais i ON s.submissao_id = i.submissao_id 
    WHERE s.status = 'aprovado'
    AND i.status = 'publicado'
  `;

  if (q) {
    sql += ` AND ( ${COLS.map((c) => `s.${c} LIKE ?`).join(' OR ')} )`;
    params.push(...Array(COLS.length).fill(like));
  }

  if (tipo) {
    sql += ` AND s.tipo = ?`;
    params.push(tipo);
  }

  sql += ` ORDER BY COALESCE(s.ano_publicacao, 0) DESC, s.data_submissao DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  // Executa a busca digital
  const [rowsDigital] = await pool.query(sql, params);

  // --- PARTE 2: BUSCA NO ACERVO FÍSICO (NOVIDADE) ---
  let rowsFisico = [];

  // Só buscamos no físico se tiver um termo de pesquisa e estivermos na primeira página
  // (Isso evita ficar buscando o físico de novo quando o usuário clica em "Ver mais")
  if (q && q.length >= 3 && Number(offset) === 0) {
    try {
      const resultadosLegado = await acervoLegadoService.buscarPorTitulo(q);

      // Transformamos o JSON do OpenBiblio para ficar parecido com o do Acervo Digital
      rowsFisico = resultadosLegado.map((livro) => ({
        submissao_id: `LEGACY_${livro.id_legado}`, // ID falso para não quebrar a key do React
        item_id: null,
        titulo_proposto: livro.titulo, // Mapeia Titulo -> Titulo Proposto
        autor: livro.autor,
        descricao: `Acervo Físico - Código: ${livro.codigo_barras}`,
        editora: 'Acervo Biblioteca',
        ano_publicacao: 'Físico',
        tipo: 'fisico', // Tipo especial para o front saber que é físico
        origem: 'FISICO',
        status_fisico: livro.status, // Disponível/Emprestado/etc.
      }));
    } catch (error) {
      console.error(
        'Erro ao buscar legado (ignorado para não travar o digital):',
        error.message
      );
      // Se der erro no legado, segue a vida só com os digitais
    }
  }

  // --- PARTE 3: MISTURA TUDO ---
  // Colocamos os físicos primeiro para destaque, seguidos pelos digitais
  return [...rowsFisico, ...rowsDigital];
}

/**
 * Detalha uma publicação aprovada (digital OU física legacy)
 */
async function buscarAprovadaPorId(id) {
  // 1. VERIFICAÇÃO: É um ID do sistema antigo? (Começa com LEGACY_)
  if (String(id).startsWith('LEGACY_')) {
    const idReal = id.split('_')[1]; // Pega o número depois do underline (ex: 105)

    const livroFisico = await acervoLegadoService.buscarPorId(idReal);

    if (!livroFisico) return null;

    // 🔎 NOVO: verifica se existe reserva ativa para este bibid
    let statusReservas = null;
    try {
      const [rowsReserva] = await pool.query(
        'SELECT status FROM dg_reservas WHERE legacy_bibid = ? AND status = "ativa" LIMIT 1',
        [idReal]
      );
      if (rowsReserva.length > 0) {
        statusReservas = rowsReserva[0].status; // 'ativa'
      }
    } catch (err) {
      console.error('Erro ao consultar reservas para livro físico:', err.message);
    }

    // Limpeza do ISBN (Backend faz o trabalho sujo)
    const isbnLimpo = livroFisico.isbn
      ? String(livroFisico.isbn).split(' ')[0]
      : null;

    // Detalhes técnicos agrupados (Páginas + Edição)
    const detalhesArr = [];
    if (livroFisico.paginas) detalhesArr.push(livroFisico.paginas);
    if (livroFisico.edicao) detalhesArr.push(livroFisico.edicao);
    const detalhesTexto =
      detalhesArr.length > 0 ? detalhesArr.join(' | ') : null;

    // Se tiver reserva ativa, forçamos status para "Reservado"
    const statusFinal =
      statusReservas === 'ativa' ? 'Reservado' : livroFisico.status;

    return {
      submissao_id: id,
      titulo_proposto: livroFisico.titulo,

      // descricao será apenas a sinopse (se tiver)
      descricao: livroFisico.sinopse || null,

      // Dados técnicos agrupados / separados
      localizacao: livroFisico.localizacao,
      isbn: isbnLimpo,
      detalhes_fisicos: detalhesTexto,
      codigo_barras: livroFisico.codigo_barras,
      assunto: livroFisico.assunto,

      autor: livroFisico.autor,
      editora: livroFisico.editora,
      ano_publicacao: livroFisico.ano,
      tipo: 'fisico',
      caminho_anexo: null,

      status: statusFinal,
      disponibilidade: statusFinal,
      status_fisico: statusFinal,
      origem: 'FISICO',
    };
  }

  // 2. SE NÃO FOR LEGACY, SEGUE A VIDA (BUSCA NO BANCO NOVO DIGITAL)
  const [rows] = await pool.query(
    `
    SELECT 
      s.submissao_id, 
      i.item_id,
      s.titulo_proposto, s.descricao, s.caminho_anexo, 
      s.autor, s.editora, s.ano_publicacao, s.conferencia, s.periodico, s.instituicao,
      s.orientador, s.curso, s.ano_defesa, s.tipo, s.data_submissao,
      'DIGITAL' as origem
    FROM dg_submissoes s
    LEFT JOIN dg_itens_digitais i ON s.submissao_id = i.submissao_id
    WHERE s.submissao_id = ? 
    AND s.status = 'aprovado'   -- A submissão foi aprovada pelo admin
    AND i.status = 'publicado'  -- O item já venceu o agendamento (SEGURANÇA AQUI)
    `,
    [id]
  );
  return rows[0] || null;

}
  async function contarPublicados() {
  try {
    const sql = `
      SELECT COUNT(*) as total
      FROM dg_submissoes s
      INNER JOIN dg_itens_digitais i ON s.submissao_id = i.submissao_id
      WHERE s.status = 'aprovado'
      AND i.status = 'publicado'
    `;
    
    const [rows] = await pool.query(sql);
    return rows[0].total;
  } catch (error) {
    console.error("Erro ao contar itens digitais:", error);
    return 0;
  }
}

module.exports = { buscarAprovadas, buscarAprovadaPorId, contarPublicados };
