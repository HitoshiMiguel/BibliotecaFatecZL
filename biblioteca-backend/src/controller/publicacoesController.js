// src/controller/publicacoesController.js
const svc = require('../services/publicacoesService');

exports.listarAprovadas = async (req, res) => {
  try {
    const { q = '', tipo, limit, offset } = req.query;
    const items = await svc.buscarAprovadas({ q, tipo, limit, offset });
    res.json({ items });
  } catch (err) {
    console.error('ERRO /publicacoes:', err);
    res.status(500).json({ error: 'Falha ao consultar publicações.' });
  }
};

exports.detalharAprovada = async (req, res) => {
  try {
    const item = await svc.buscarAprovadaPorId(req.params.id);
    if (!item) return res.status(404).json({ error: 'Publicação não encontrada.' });
    res.json(item);
  } catch (err) {
    console.error('ERRO /publicacoes/:id', err);
    res.status(500).json({ error: 'Falha ao consultar publicação.' });
  }
};
