const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_DIR = path.join(process.cwd(), 'tokens');
const TOKEN_PATH = path.join(TOKEN_DIR, 'google-oauth.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getOAuth2Client() {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = process.env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
    throw new Error('Faltam variáveis do OAuth: GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI');
  }
  return new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI);
}

function getAuthUrl() {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
}

function saveTokens(tokens) {
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
}

function hasTokens() {
  return !!loadTokens();
}

function getDriveWithOAuth() {
  const oauth2 = getOAuth2Client();
  const tokens = loadTokens();
  if (!tokens) throw new Error('OAuth ainda não autorizado. Acesse /api/google/auth para autorizar.');
  oauth2.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: oauth2 });
}

module.exports = { getAuthUrl, getOAuth2Client, saveTokens, hasTokens, getDriveWithOAuth };
