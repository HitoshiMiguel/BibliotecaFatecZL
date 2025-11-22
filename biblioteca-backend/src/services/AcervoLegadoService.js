// src/services/AcervoLegadoService.js
const { poolOpenBiblio } = require('../infra/db/mysql/connection');

class AcervoLegadoService {

  // --- LISTAGEM (Busca Rápida) ---
  async buscarPorTitulo(termo) {
    const termoBusca = `%${termo}%`;
    
    const sql = `
      SELECT 
        b.bibid,
        -- 🪄 A MÁGICA ACONTECE AQUI: Forçamos a conversão de binário para UTF8
        CONVERT(CAST(b.title AS BINARY) USING utf8) as titulo,
        CONVERT(CAST(b.author AS BINARY) USING utf8) as autor,
        
        c.barcode_nmbr as codigo_barras,
        c.status_cd as status_original,
        
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '260' AND subfield_cd = 'b' LIMIT 1) as editora_marc,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '260' AND subfield_cd = 'c' LIMIT 1) as ano_marc
      FROM biblio b
      INNER JOIN biblio_copy c ON b.bibid = c.bibid
      WHERE b.title LIKE ? OR b.author LIKE ?
      LIMIT 50
    `;

    try {
      const [rows] = await poolOpenBiblio.execute(sql, [termoBusca, termoBusca]);

      return rows.map(livro => ({
        id_legado: livro.bibid,
        titulo: livro.titulo,
        autor: livro.autor,
        editora: livro.editora_marc || 'Acervo Fatec',
        ano: this.limparAno(livro.ano_marc),
        codigo_barras: livro.codigo_barras,
        status: this.traduzirStatus(livro.status_original),
        origem: 'ACERVO_FISICO'
      }));
    } catch (error) {
      console.error("Erro lista legado:", error);
      return [];
    }
  }

  // --- DETALHES ---
  async buscarPorId(bibid) {
    const sql = `
      SELECT 
        b.bibid, 
        -- 🪄 CONVERSÃO MÁGICA NO DETALHE TAMBÉM
        CONVERT(CAST(b.title AS BINARY) USING utf8) as titulo,
        CONVERT(CAST(b.author AS BINARY) USING utf8) as autor,
        b.call_nmbr1 as localizacao,
        
        c.barcode_nmbr as codigo_barras, 
        c.status_cd as status_original,
        
        -- Nos subselects também é bom garantir, mas geralmente o field_data já vem ok
        -- Se a editora ou sinopse também bugarem, aplicamos a mesma lógica neles
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '260' AND subfield_cd = 'b' LIMIT 1) as editora,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '260' AND subfield_cd = 'c' LIMIT 1) as ano,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '250' AND subfield_cd = 'a' LIMIT 1) as edicao,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '650' AND subfield_cd = 'a' LIMIT 1) as assunto,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '520' AND subfield_cd = 'a' LIMIT 1) as sinopse,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '020' AND subfield_cd = 'a' LIMIT 1) as isbn,
        (SELECT field_data FROM biblio_field WHERE bibid = b.bibid AND tag = '300' AND subfield_cd = 'a' LIMIT 1) as paginas

      FROM biblio b
      LEFT JOIN biblio_copy c ON b.bibid = c.bibid
      WHERE b.bibid = ?
      LIMIT 1
    `;

    try {
      const [rows] = await poolOpenBiblio.execute(sql, [bibid]);
      
      if (rows.length === 0) return null;

      const livro = rows[0];
      
      return {
        id_legado: livro.bibid,
        titulo: livro.titulo,
        autor: livro.autor,
        editora: livro.editora || 'Acervo Fatec',
        ano: this.limparAno(livro.ano),
        edicao: livro.edicao || '', 
        assunto: livro.assunto || '',
        
        sinopse: livro.sinopse, 
        
        localizacao: livro.localizacao, 
        isbn: livro.isbn,
        paginas: livro.paginas,

        codigo_barras: livro.codigo_barras,
        status: this.traduzirStatus(livro.status_original),
        origem: 'ACERVO_FISICO'
      };
    } catch (error) {
      console.error("Erro detalhe legado:", error);
      return null;
    }
  }

  // --- HELPERS ---
  traduzirStatus(statusCode) {
    if (!statusCode) return 'Indisponível';
    const code = String(statusCode).trim().toLowerCase();
    
    if (code === 'in') return 'Disponível'; 
    if (code === 'out') return 'Emprestado'; 
    if (code === 'hld') return 'Indisponível (Reservado)';
    if (code === 'mnd') return 'Em Manutenção'; 
    if (code === 'dis') return 'Exposição'; 
    if (code === 'new') return 'Processamento Técnico';
    
    return `Indisponível (Cód: ${code})`;
  }

  limparAno(anoBruto) {
    if (!anoBruto) return 'S/D';
    return anoBruto.replace(/[^0-9]/g, '') || 'S/D';
  }


async buscarPorListaIds(listaIds) {
    if (!listaIds || listaIds.length === 0) return [];

    // Monta string de IDs segura: "1, 2, 3"
    const idsString = listaIds.map(id => Number(id)).join(',');

    const sql = `
      SELECT 
        b.bibid,
        b.title as titulo,
        b.author as autor,
        c.barcode_nmbr as codigo_barras,
        c.status_cd as status_original
      FROM biblio b
      LEFT JOIN biblio_copy c ON b.bibid = c.bibid
      WHERE b.bibid IN (${idsString})
    `;

    try {
      const [rows] = await poolOpenBiblio.execute(sql);
      
      // Remove duplicatas (caso o livro tenha 2 cópias, o join traz 2x)
      const unicos = [];
      const map = new Map();
      for (const item of rows) {
          if(!map.has(item.bibid)){
              map.set(item.bibid, true);    // set any value to Map
              unicos.push({
                  id_legado: item.bibid,
                  titulo: item.titulo,
                  autor: item.autor,
                  tipo: 'fisico',
                  origem: 'FISICO'
              });
          }
      }
      return unicos;

    } catch (error) {
      console.error("Erro ao buscar lista legado:", error);
      return [];
    }
  }
}

module.exports = new AcervoLegadoService();