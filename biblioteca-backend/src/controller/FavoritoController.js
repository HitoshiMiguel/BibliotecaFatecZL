// Em: src/app/controller/FavoritoController.js

const FavoritoService = require('../services/FavoritoService');
const { err } = require('../utils/httpError');

class FavoritoController {

    async adicionar(req, res, next) {
        try {
            const usuarioId = req.user.id; 
            // itemId pode vir como número (10) ou string ("LEGACY_500")
            let { itemId } = req.body; 

            if (!itemId) return next(err(400, 'VALIDATION_ERROR', 'ID obrigatório.'));

            let tipo = 'DIGITAL';
            let idReal = itemId;

            // Verifica se é físico
            if (String(itemId).startsWith('LEGACY_')) {
                tipo = 'FISICO';
                idReal = itemId.split('_')[1]; // Pega o 500 de LEGACY_500
            }

            const resultado = await FavoritoService.addFavorito(usuarioId, idReal, tipo);
            
            if (!resultado.success) {
                return res.status(409).json({ message: resultado.message });
            }

            res.status(201).json({ message: 'Favoritado!', favoritoId: resultado.insertId });

        } catch (error) {
            console.error('Erro add favorito:', error);
            next(error);
        }
    }

    async remover(req, res, next) {
        try {
            const usuarioId = req.user.id;
            const { itemId } = req.params; 

            if (!itemId) return next(err(400, 'VALIDATION_ERROR', 'ID obrigatório.'));
            
            let tipo = 'DIGITAL';
            let idReal = itemId;

            // Verifica se é físico
            if (String(itemId).startsWith('LEGACY_')) {
                tipo = 'FISICO';
                idReal = itemId.split('_')[1];
            }

            const resultado = await FavoritoService.removeFavorito(usuarioId, idReal, tipo);

            if (!resultado.success) {
                return res.status(404).json({ message: resultado.message });
            }

            res.status(200).json({ message: 'Removido.' });

        } catch (error) {
            console.error('Erro remover favorito:', error);
            next(error);
        }
    }

    // Listar (IDs) e ListarDetalhes não precisam mudar muito
    // pois o Service já entrega os IDs formatados (com e sem LEGACY_)
    
    async listar(req, res, next) {
        try {
            const usuarioId = req.user.id;
            const favoritos = await FavoritoService.listarDetalhesPorUsuario(usuarioId);
            res.status(200).json(favoritos);
        } catch (error) {
            next(error);
        }
    }

    async listarDetalhes(req, res, next) {
        try {
            const usuarioId = req.user.id;
            const favoritos = await FavoritoService.listarDetalhesPorUsuario(usuarioId);
            res.status(200).json(favoritos); 
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FavoritoController();