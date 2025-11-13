// Em: src/app/controller/FavoritoController.js

const FavoritoService = require('../services/FavoritoService');
const { err } = require('../utils/httpError');

class FavoritoController {

    /**
     * Rota POST: Adiciona um novo favorito
     */
    async adicionar(req, res, next) {
        try {
            // O seu authMiddleware salva o ID em 'req.user.id'
            const usuarioId = req.user.id; 
            const { itemId } = req.body;

            if (!itemId) {
                return next(err(400, 'VALIDATION_ERROR', 'O ID do item (itemId) é obrigatório.'));
            }

            if (!usuarioId) {
                return next(err(401, 'UNAUTHORIZED', 'Usuário não autenticado.'));
            }

            const resultado = await FavoritoService.addFavorito(usuarioId, itemId);
            
            if (!resultado.success) {
                return res.status(409).json({ message: resultado.message }); // 409 Conflict
            }

            res.status(201).json({ message: 'Item favoritado com sucesso!', favoritoId: resultado.insertId });

        } catch (error) {
            console.error('Erro no FavoritoController.adicionar:', error);
            next(error);
        }
    }

    /**
     * Rota DELETE: Remove um favorito
     */
    async remover(req, res, next) {
        try {
            // O seu authMiddleware salva o ID em 'req.user.id'
            const usuarioId = req.user.id;
            const { itemId } = req.params; 

            if (!itemId) {
                return next(err(400, 'VALIDATION_ERROR', 'O ID do item (itemId) é obrigatório na URL.'));
            }
            
            if (!usuarioId) {
                return next(err(401, 'UNAUTHORIZED', 'Usuário não autenticado.'));
            }

            const resultado = await FavoritoService.removeFavorito(usuarioId, Number(itemId));

            if (!resultado.success) {
                return res.status(404).json({ message: resultado.message }); // 404 Not Found
            }

            res.status(200).json({ message: 'Favorito removido com sucesso.' });

        } catch (error) {
            console.error('Erro no FavoritoController.remover:', error);
            next(error);
        }
    }

    /**
     * [NOVO] Rota GET: Lista todos os favoritos do usuário logado
     */
    async listar(req, res, next) {
        try {
            const usuarioId = req.user.id; // Pega o ID do usuário logado

            if (!usuarioId) {
                return next(err(401, 'UNAUTHORIZED', 'Usuário não autenticado.'));
            }

            // Chama o novo service
            const favoritosIds = await FavoritoService.listarPorUsuario(usuarioId);
            
            // Retorna a lista de IDs
            res.status(200).json(favoritosIds); // Ex: [1, 5, 22]

        } catch (error) {
            console.error('Erro no FavoritoController.listar:', error);
            next(error);
        }
    }
}

module.exports = new FavoritoController();