// src/controller/AvaliacaoController.js
const AvaliacaoModel = require('../model/AvaliacaoModel');

/**
 * GET /api/publicacoes/:id/avaliacoes?tipo=digital|fisico
 * Retorna avaliações + média + contagem + avaliação do usuário logado
 */
async function getAvaliacoes(req, res, next) {
  try {
    const { id } = req.params;
    const { tipo } = req.query; // Lê da query string (?tipo=fisico)
    const usuarioId = req.user?.id; // Do middleware de autenticação

    // Define padrão como 'digital' se não vier nada
    const tipoItem = tipo === 'fisico' ? 'fisico' : 'digital';

    if (!id) {
      return res.status(400).json({ ok: false, error: 'ID do item é obrigatório' });
    }

    const { average, count } = await AvaliacaoModel.getAvaliacoesByItem(id, tipoItem);
    
    let userRating = null;
    if (usuarioId) {
      const userAvaliacao = await AvaliacaoModel.getAvaliacaoByUserAndItem(usuarioId, id, tipoItem);
      userRating = userAvaliacao?.nota || null;
    }

    res.json({
      ok: true,
      data: {
        average,
        count,
        userRating,
        itemId: id,
        tipo: tipoItem
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/publicacoes/:id/avaliar
 * Body: { nota: 1-5, tipo: 'digital' | 'fisico' }
 * Query: ?tipo=fisico (Opcional, mas recomendado para segurança)
 */
async function salvarAvaliacao(req, res, next) {
  try {
    const { id } = req.params;
    const { nota } = req.body; 
    
    // MELHORIA DE SEGURANÇA:
    // Tenta pegar o tipo do corpo (body) OU da URL (query).
    // Isso resolve o problema se o JSON não estiver sendo lido corretamente.
    const tipoRecebido = req.body.tipo || req.query.tipo;
    
    const usuarioId = req.user?.id;

    // Garante que é 'fisico' ou 'digital'
    const tipoItem = tipoRecebido === 'fisico' ? 'fisico' : 'digital';

    console.log(`[AvaliacaoController] POST /avaliar`);
    console.log(` - ID: ${id}`);
    console.log(` - Nota: ${nota}`);
    console.log(` - Tipo Recebido: ${tipoRecebido}`);
    console.log(` - Tipo Final: ${tipoItem}`);

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ ok: false, error: 'ID obrigatório' });
    }

    if (!nota || nota < 1 || nota > 5) {
      return res.status(400).json({ ok: false, error: 'Nota deve estar entre 1 e 5' });
    }

    // Chama o Model (que já limpa o ID se tiver LEGACY_)
    await AvaliacaoModel.saveAvaliacao(usuarioId, id, nota, tipoItem);
    console.log(' ✅ Avaliação salva com sucesso');

    // Retorna os dados atualizados (nova média)
    const { average, count } = await AvaliacaoModel.getAvaliacoesByItem(id, tipoItem);

    res.json({
      ok: true,
      message: 'Avaliação salva com sucesso',
      data: {
        average,
        count,
        userRating: nota,
        itemId: id,
        tipo: tipoItem
      }
    });
  } catch (err) {
    console.log(' ❌ Erro no Controller:', err.message);
    next(err);
  }
}

/**
 * DELETE /api/publicacoes/:id/avaliar?tipo=digital|fisico
 */
async function deletarAvaliacao(req, res, next) {
  try {
    const { id } = req.params;
    const { tipo } = req.query; // Lê da query (?tipo=fisico)
    const usuarioId = req.user?.id;

    const tipoItem = tipo === 'fisico' ? 'fisico' : 'digital';

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'Usuário não autenticado' });
    }

    if (!id) {
      return res.status(400).json({ ok: false, error: 'ID obrigatório' });
    }

    await AvaliacaoModel.deleteAvaliacao(usuarioId, id, tipoItem);

    res.json({
      ok: true,
      message: 'Avaliação removida com sucesso'
    });
  } catch (err) {
    next(err);
  }
}

async function getMinhasEstatisticas(req, res, next) {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'Usuário não autenticado' });
    }

    // 1. Dados do Gráfico
    const estatisticas = await AvaliacaoModel.getEstatisticasPorAutor(usuarioId);
    
    // 2. Contagem dos Status (Aprovado, Pendente, Rejeitado)
    const counts = await AvaliacaoModel.getContagemStatus(usuarioId);

    const totalDownloads = await AvaliacaoModel.getTotalDownloadsUsuario(usuarioId);

    res.json({
      ok: true,
      data: estatisticas,
      meta: {
        totalAprovados: counts.aprovado,
        totalPendentes: counts.pendente,
        totalRejeitados: counts.rejeitado,
        totalDownloads: totalDownloads
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvaliacoes,
  salvarAvaliacao,
  deletarAvaliacao,
  getMinhasEstatisticas
};