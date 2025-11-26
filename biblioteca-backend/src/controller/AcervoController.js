// src/controller/AcervoController.js
const acervoLegadoService = require('../services/AcervoLegadoService');
const publicacoesService = require('../services/publicacoesService'); // 🆕 Importamos o serviço digital

// Busca padrão (já existia)
const buscarLivros = async (req, res) => {
  const { q } = req.query; 

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

// 🆕 NOVA FUNÇÃO: Estatísticas
const obterEstatisticas = async (req, res) => {
  try {
    // 1. Busca dados do Legado (Físico + Títulos Gerais)
    // Retorna: { totalTitulos: X, livrosFisicos: Y, itensDigitais: 0 }
    const statsFisico = await acervoLegadoService.contarTotais();

    // 2. Busca dados do Novo (Digitais)
    // Retorna apenas o número (ex: 50)
    const totalDigitais = await publicacoesService.contarPublicados();

    // 3. Monta o objeto final substituindo o zero pelos digitais reais
    // Se você quiser somar os digitais no "Total de Títulos" também, podemos somar ali embaixo.
    const respostaFinal = {
      totalTitulos: statsFisico.livrosFisicos + totalDigitais, 
      livrosFisicos: statsFisico.livrosFisicos,
      itensDigitais: totalDigitais
    };

    return res.json(respostaFinal);

  } catch (error) {
    console.error("Erro nas estatisticas:", error);
    return res.status(500).json({ error: "Erro ao buscar dados dos livros" });
  }
};

module.exports = { 
  buscarLivros,
  obterEstatisticas 
};