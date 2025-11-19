// src/controller/AcervoController.js
const acervoLegadoService = require('../services/AcervoLegadoService');

const buscarLivros = async (req, res) => {
  const { q } = req.query; // O front vai mandar ?q=Harry Potter

  if (!q || q.length < 3) {
    return res.status(400).json({ error: "Digite pelo menos 3 caracteres para buscar." });
  }

  try {
    const livros = await acervoLegadoService.buscarPorTitulo(q);
    return res.json(livros);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { buscarLivros };