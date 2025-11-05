const express = require('express');
const { getAuthUrl, getOAuth2Client, saveTokens, hasTokens } = require('../../../lib/googleOAuth');

const router = express.Router();

// inicia o fluxo OAuth (retorna uma URL do Google)
router.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.json({ url, authorized: hasTokens() });
});

// callback do Google: troca code -> tokens e salva em /tokens/google-oauth.json
router.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Código ausente.');

    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    saveTokens(tokens);

    res.send('<h1>✅ Autorizado! Pode fechar esta aba.</h1>');
  } catch (e) {
    console.error('OAuth callback error:', e);
    res.status(500).send('Erro no OAuth.');
  }
});

module.exports = router;
