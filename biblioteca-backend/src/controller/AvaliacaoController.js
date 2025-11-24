// src/controller/AvaliacaoController.js
const AvaliacaoModel = require('../model/AvaliacaoModel');

/**
 * GET /api/publicacoes/:id/avaliacoes
 * Retorna avaliações + média + contagem + avaliação do usuário logado
 */
async function getAvaliacoes(req, res, next) {
  try {
    const { id: itemId } = req.params;
    const usuarioId = req.user?.id; // Do middleware de autenticação (req.user.id, não usuario_id)

    if (!itemId) {
      return res.status(400).json({ ok: false, error: 'itemId obrigatório' });
    }

    const { rows, average, count } = await AvaliacaoModel.getAvaliacoesByItem(itemId);
    
    let userRating = null;
    if (usuarioId) {
      const userAvaliacao = await AvaliacaoModel.getAvaliacaoByUserAndItem(usuarioId, itemId);
      userRating = userAvaliacao?.nota || null;
    }

    res.json({
      ok: true,
      data: {
        average,
        count,
        userRating,
        itemId
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/publicacoes/:id/avaliar
 * Cria/atualiza uma avaliação (requer autenticação)
 * Body: { nota: 1-5 }
 */
async function salvarAvaliacao(req, res, next) {
  try {
    const { id: itemId } = req.params;
    const { nota } = req.body;
    const usuarioId = req.user?.id; // Do middleware de autenticação (req.user.id)

    console.log('[AvaliacaoController] POST /api/publicacoes/:id/avaliar');
    console.log('  itemId:', itemId);
    console.log('  nota:', nota);
    console.log('  usuarioId:', usuarioId);
    console.log('  req.user:', req.user);

    if (!usuarioId) {
      console.log('  ❌ Usuário não autenticado');
      return res.status(401).json({ ok: false, error: 'Usuário não autenticado' });
    }

    if (!itemId) {
      console.log('  ❌ itemId obrigatório');
      return res.status(400).json({ ok: false, error: 'itemId obrigatório' });
    }

    if (!nota || nota < 1 || nota > 5) {
      console.log('  ❌ nota inválida:', nota);
      return res.status(400).json({ ok: false, error: 'nota deve estar entre 1 e 5' });
    }

    await AvaliacaoModel.saveAvaliacao(usuarioId, itemId, nota);
    console.log('  ✅ Avaliação salva com sucesso');

    // Retorna dados atualizados
    const { rows, average, count } = await AvaliacaoModel.getAvaliacoesByItem(itemId);

    res.json({
      ok: true,
      message: 'Avaliação salva com sucesso',
      data: {
        average,
        count,
        userRating: nota,
        itemId
      }
    });
  } catch (err) {
    console.log('  ❌ Erro:', err.message);
    next(err);
  }
}

/**
 * DELETE /api/publicacoes/:id/avaliar
 * Remove a avaliação do usuário logado (requer autenticação)
 */
async function deletarAvaliacao(req, res, next) {
  try {
    const { id: itemId } = req.params;
    const usuarioId = req.user?.id; // Do middleware de autenticação (req.user.id)

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'Usuário não autenticado' });
    }

    if (!itemId) {
      return res.status(400).json({ ok: false, error: 'itemId obrigatório' });
    }

    await AvaliacaoModel.deleteAvaliacao(usuarioId, itemId);

    res.json({
      ok: true,
      message: 'Avaliação removida com sucesso'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvaliacoes,
  salvarAvaliacao,
  deletarAvaliacao
};
