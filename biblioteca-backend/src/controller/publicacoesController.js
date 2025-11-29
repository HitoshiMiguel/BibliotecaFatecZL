const svc = require('../services/publicacoesService');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Ajuste o caminho se necessário, mas parece estar em src/lib/googleOAuth.js
const { getOAuth2Client } = require('../lib/googleOAuth'); 

// ==========================================
// FUNÇÃO AUXILIAR: CONECTAR COM TOKENS SALVOS
// ==========================================
const getDriveService = () => {
  const auth = getOAuth2Client();
  
  // --- AQUI ESTÁ A CORREÇÃO DO CAMINHO ---
  // Sobe de 'controller' para 'src' (..), sobe de 'src' para a raiz (..), entra em 'tokens'
  const TOKEN_PATH = path.join(__dirname, '../../tokens/google-oauth.json');

  if (fs.existsSync(TOKEN_PATH)) {
    // Lê o arquivo que você encontrou no print
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    
    // Injeta as credenciais no cliente do Google
    auth.setCredentials(tokens);
  } else {
    console.error(`[GoogleDrive] Arquivo NÃO encontrado em: ${TOKEN_PATH}`);
    throw new Error('Sistema não logado no Google. Por favor, acesse /api/google/auth para logar.');
  }
  
  return google.drive({ version: 'v3', auth });
};

// ==========================================
// LISTAR E DETALHAR (MANTIDOS)
// ==========================================
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

// ==========================================
// PROXY DA CAPA
// ==========================================
exports.obterCapaPublicacao = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Busca no banco
    const item = await svc.buscarAprovadaPorId(id);
    
    if (!item || !item.caminho_anexo) {
      return res.status(404).send('Sem anexo');
    }

    const driveFileId = item.caminho_anexo;

    // 2. Conecta no Google Drive (Agora lendo o JSON correto!)
    const drive = getDriveService(); 
    
    // 3. Pede o link da thumbnail
    const fileMetadata = await drive.files.get({
      fileId: driveFileId,
      fields: 'thumbnailLink'
    });

    const thumbLink = fileMetadata.data.thumbnailLink;
    if (!thumbLink) {
      return res.status(404).send('Google não gerou capa');
    }

    // Aumenta resolução
    const highResLink = thumbLink.replace('=s220', '=s500');

    // 4. Baixa e envia a imagem
    const imageRes = await fetch(highResLink);

    if (!imageRes.ok) {
       throw new Error(`Google recusou a imagem: ${imageRes.status}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    res.send(buffer);

  } catch (err) {
    console.error('ERRO CAPA:', err.message);
    
    // Tratamento de erros comuns
    if (err.message.includes('404')) return res.status(404).send('Arquivo não encontrado no Drive');
    if (err.message.includes('invalid_grant')) return res.status(500).send('Login do Google expirou. Logue novamente.');
    if (err.message.includes('Sistema não logado')) return res.status(500).send(err.message);

    res.status(500).send('Erro ao obter capa');
  }
};