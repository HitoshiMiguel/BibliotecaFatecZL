// Em: src/app/services/FavoritoService.js

const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');
// Importamos o serviço legado para buscar os dados físicos
const acervoLegadoService = require('./AcervoLegadoService');

class FavoritoService {

    /**
     * Adiciona Favorito (Suporta Digital e Físico)
     * @param {number} usuarioId 
     * @param {number} idItem - ID do item ou bibid
     * @param {string} tipo - 'DIGITAL' ou 'FISICO'
     */
    async addFavorito(usuarioId, idItem, tipo = 'DIGITAL') {
        let sql = "";
        let params = [];

        if (tipo === 'FISICO') {
            // Salva no campo id_legado, deixa item_id null
            sql = "INSERT INTO dg_favoritos (usuario_id, id_legado, item_id) VALUES (?, ?, NULL)";
            params = [usuarioId, idItem];
        } else {
            // Padrão antigo: Salva no item_id
            sql = "INSERT INTO dg_favoritos (usuario_id, item_id, id_legado) VALUES (?, ?, NULL)";
            params = [usuarioId, idItem];
        }
        
        try {
            const [results] = await pool.query(sql, params);
            return { success: true, insertId: results.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Item já está nos favoritos.' };
            }
            console.error('Erro ao adicionar favorito:', error);
            throw error;
        }
    }

    /**
     * Remove Favorito
     */
    async removeFavorito(usuarioId, idItem, tipo = 'DIGITAL') {
        let sql = "";
        
        if (tipo === 'FISICO') {
            sql = "DELETE FROM dg_favoritos WHERE usuario_id = ? AND id_legado = ?";
        } else {
            sql = "DELETE FROM dg_favoritos WHERE usuario_id = ? AND item_id = ?";
        }
        
        try {
            const [results] = await pool.query(sql, [usuarioId, idItem]);
            
            if (results.affectedRows === 0) {
                return { success: false, message: 'Favorito não encontrado.' };
            }
            return { success: true, message: 'Favorito removido.' };
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            throw error;
        }
    }

    /**
     * Lista apenas IDs (Usado para verificar se o coração está pintado)
     */
    async listarPorUsuario(usuarioId) {
        const sql = "SELECT item_id, id_legado FROM dg_favoritos WHERE usuario_id = ?";
        
        try {
            const [rows] = await pool.query(sql, [usuarioId]);
            // Retorna lista mista: [10, 20, "LEGACY_500", "LEGACY_501"]
            // Usamos prefixo para o front saber diferenciar
            const lista = rows.map(row => {
                if (row.id_legado) return `LEGACY_${row.id_legado}`;
                return row.item_id;
            });
            return lista;
        } catch (error) {
            console.error('Erro ao listar IDs favoritos:', error);
            throw error;
        }
    }

    /**
     * Lista Detalhes COMPLETOS (Mistura Digital + Físico)
     */
    async listarDetalhesPorUsuario(usuarioId) {
      try {
        // 1. Busca tudo na tabela de favoritos
        const sql = `SELECT item_id, id_legado FROM dg_favoritos WHERE usuario_id = ?`;
        const [favoritos] = await pool.query(sql, [usuarioId]);
        
        const idsDigitais = [];
        const idsFisicos = [];

        // 2. Separa o joio do trigo
        favoritos.forEach(fav => {
            if (fav.item_id) idsDigitais.push(fav.item_id);
            if (fav.id_legado) idsFisicos.push(fav.id_legado);
        });

        // 3. Busca os dados Digitais (Se houver)
        let digitais = [];
        if (idsDigitais.length > 0) {
            // Mesma query de antes para digitais
            const sqlDigital = `
                SELECT i.item_id, s.submissao_id, s.titulo_proposto AS titulo, s.autor, 'DIGITAL' as origem
                FROM dg_itens_digitais i
                JOIN dg_submissoes s ON i.submissao_id = s.submissao_id
                WHERE i.item_id IN (?)
            `;
            const [rowsDig] = await pool.query(sqlDigital, [idsDigitais]);
            digitais = rowsDig;
        }

        // 4. Busca os dados Físicos (Se houver)
        let fisicos = [];
        if (idsFisicos.length > 0) {
            fisicos = await acervoLegadoService.buscarPorListaIds(idsFisicos);
        }

        // 5. Formata para o padrão unificado do front
        const digitaisFormatados = digitais.map(d => ({
            id_favorito: d.item_id, 
            id_visualizacao: d.submissao_id, // Tente garantir que aqui está d.item_id
            titulo: d.titulo,
            autor: d.autor,
            tipo: 'DIGITAL',
            // DEBUG: Vamos ver os IDs crus
            _debug_submissao: d.submissao_id,
            _debug_item: d.item_id
        }));

        // ADICIONE ISSO AQUI:
        console.log("--- DEBUG FAVORITOS ---");
        console.log("SQL Retornou:", digitais); 
        console.log("Formatado:", digitaisFormatados);

        const fisicosFormatados = fisicos.map(f => ({
            id_favorito: `LEGACY_${f.id_legado}`, // ID com prefixo
            id_visualizacao: `LEGACY_${f.id_legado}`, // Link também usa prefixo
            titulo: f.titulo,
            autor: f.autor,
            tipo: 'FISICO'
        }));

        // 6. Retorna tudo misturado
        return [...fisicosFormatados, ...digitaisFormatados];

      } catch (error) {
        console.error('Erro ao listar detalhes mistos:', error);
        throw error;
      }
    }

}

module.exports = new FavoritoService();