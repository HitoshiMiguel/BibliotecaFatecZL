// Em: src/app/services/FavoritoService.js

// 1. Importamos a conexão 'pool'
const pool = require('../config/db.js');

class FavoritoService {

    /**
     * Adiciona um item aos favoritos de um usuário
     */
    async addFavorito(usuarioId, itemId) {
        const sql = "INSERT INTO dg_favoritos (usuario_id, item_id) VALUES (?, ?)";
        
        try {
            const [results] = await pool.query(sql, [usuarioId, itemId]);
            return { success: true, insertId: results.insertId };

        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Item já está nos favoritos.' };
            }
            console.error('Erro ao adicionar favorito no service:', error);
            throw error;
        }
    }

    /**
     * Remove um item dos favoritos de um usuário
     */
    async removeFavorito(usuarioId, itemId) {
        const sql = "DELETE FROM dg_favoritos WHERE usuario_id = ? AND item_id = ?";
        
        try {
            const [results] = await pool.query(sql, [usuarioId, itemId]);
            
            if (results.affectedRows === 0) {
                return { success: false, message: 'Favorito não encontrado.' };
            }
            
            return { success: true, message: 'Favorito removido com sucesso.' };

        } catch (error) {
            console.error('Erro ao remover favorito no service:', error);
            throw error;
        }
    }

    /**
     * [NOVO] Lista todos os IDs de itens favoritados por um usuário
     */
    async listarPorUsuario(usuarioId) {
        // Retorna apenas os IDs dos itens
        const sql = "SELECT item_id FROM dg_favoritos WHERE usuario_id = ?";
        
        try {
            const [rows] = await pool.query(sql, [usuarioId]);
            const idList = rows.map(row => row.item_id);
            return idList;

        } catch (error) {
            console.error('Erro ao listar favoritos no service:', error);
            throw error;
        }
    } // <-- FIM DO MÉTODO (sem vírgula, sem chave extra)

    /**
     * [NOVO] Lista os detalhes dos favoritos de um usuário
     * (item_id, submissao_id e titulo)
     */
    async listarDetalhesPorUsuario(usuarioId) {
      try {
        const sql = `
          SELECT 
            i.item_id,       -- ID real do item
            s.submissao_id,  -- ID da submissão (PARA O LINK)
            s.titulo_proposto AS titulo -- Título (para exibir)
          FROM dg_favoritos AS f
          
          -- Join para pegar o item_id e o submissao_id
          JOIN dg_itens_digitais AS i ON f.item_id = i.item_id
          
          -- Join para pegar o título e verificar o status
          LEFT JOIN dg_submissoes AS s ON i.submissao_id = s.submissao_id
          
          WHERE f.usuario_id = ?
            AND s.status = 'aprovado' -- Garante que o item ainda é visível
        `;
        
        const [rows] = await pool.query(sql, [usuarioId]);
        
        // Filtra caso algum item tenha sido deletado mas continue favorito
        return rows.filter(row => row.submissao_id && row.titulo);
        
      } catch (error) {
        console.error('Erro ao listar detalhes dos favoritos no service:', error);
        throw error;
      }
    }

} // <-- FIM DA CLASSE 'FavoritoService'

// Exportamos uma instância da classe (como estava no seu original)
module.exports = new FavoritoService();