// Em: src/app/services/FavoritoService.js

// 1. Importamos a conexão 'pool' do mesmo lugar que o UserModel
const pool = require('../config/db.js');

class FavoritoService {

    /**
     * Adiciona um item aos favoritos de um usuário
     * @param {number} usuarioId - O ID do usuário (vem de dg_usuarios.usuario_id)
     * @param {number} itemId - O ID do item (vem de dg_itens_digitais.item_id)
     */
    async addFavorito(usuarioId, itemId) {
        const sql = "INSERT INTO dg_favoritos (usuario_id, item_id) VALUES (?, ?)";
        
        try {
            // 2. Usamos 'await pool.query'
            const [results] = await pool.query(sql, [usuarioId, itemId]);
            return { success: true, insertId: results.insertId };

        } catch (error) {
            // Trata o erro de "chave duplicada" (ER_DUP_ENTRY)
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Item já está nos favoritos.' };
            }
            
            console.error('Erro ao adicionar favorito no service:', error);
            throw error;
        }
    }

    /**
     * Remove um item dos favoritos de um usuário
     * @param {number} usuarioId - O ID do usuário
     * @param {number} itemId - O ID do item
     */
    async removeFavorito(usuarioId, itemId) {
        const sql = "DELETE FROM dg_favoritos WHERE usuario_id = ? AND item_id = ?";
        
        try {
            // 3. Usamos 'await pool.query'
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
     * @param {number} usuarioId - O ID do usuário
     */
    async listarPorUsuario(usuarioId) {
        // Retorna apenas os IDs dos itens, que é tudo que o frontend precisa
        const sql = "SELECT item_id FROM dg_favoritos WHERE usuario_id = ?";
        
        try {
            const [rows] = await pool.query(sql, [usuarioId]);
            // Transforma o array de objetos [ {item_id: 1}, {item_id: 5} ]
            // em um array simples de números [ 1, 5 ]
            const idList = rows.map(row => row.item_id);
            return idList;

        } catch (error) {
            console.error('Erro ao listar favoritos no service:', error);
            throw error;
        }
    }
}


// Exportamos uma instância da classe
module.exports = new FavoritoService();