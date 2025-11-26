const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection');

async function registrarAcesso(req, res) {
  try {
    const { id } = req.params;

    // --- TENTATIVA 1: Busca na tabela de ITENS DIGITAIS ---
    // Verifica se o ID passado é o item_id OU se é o submissao_id vinculado
    const [itens] = await pool.query(
      `SELECT item_id, caminho_arquivo 
       FROM dg_itens_digitais 
       WHERE item_id = ? OR submissao_id = ? 
       LIMIT 1`,
      [id, id]
    );

    let linkDestino = null;
    let itemIdParaContar = null;

    if (itens.length > 0) {
      // Achamos na tabela principal!
      linkDestino = itens[0].caminho_arquivo;
      itemIdParaContar = itens[0].item_id;
    } else {
      // --- TENTATIVA 2: Busca na tabela de SUBMISSÕES ---
      // Se não existe item gerado, tenta pegar o anexo direto da submissão
      const [subs] = await pool.query(
        `SELECT caminho_anexo FROM dg_submissoes WHERE submissao_id = ? LIMIT 1`,
        [id]
      );

      if (subs.length > 0) {
        linkDestino = subs[0].caminho_anexo;
        // Não temos item_id, então não damos update no contador (ou poderíamos criar logica futura)
      }
    }

    // Se depois de tudo isso ainda for nulo
    if (!linkDestino) {
      return res.status(404).send(`Arquivo não encontrado para o ID ${id}.`);
    }

    // Limpeza e Formatação do Link
    linkDestino = linkDestino.trim();
    const isFullUrl = /^https?:\/\//i.test(linkDestino);
    
    if (!isFullUrl) {
      // Assume que é ID do Google Drive
      linkDestino = `https://drive.google.com/file/d/${linkDestino}/view?usp=sharing`;
    }

    // Incrementa contador (apenas se achamos um item_id válido na tabela correta)
    if (itemIdParaContar) {
      pool.query(
        'UPDATE dg_itens_digitais SET total_downloads = total_downloads + 1 WHERE item_id = ?',
        [itemIdParaContar]
      ).catch(err => console.error('Erro ao contar acesso:', err));
    }

    // Redireciona o usuário
    return res.redirect(linkDestino);

  } catch (error) {
    console.error('Erro no registro de acesso:', error);
    res.status(500).send('Erro interno ao processar acesso.');
  }
}

module.exports = { registrarAcesso };