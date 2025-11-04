const { google } = require('googleapis');
const { Readable } = require('stream'); // 👈 importa o Readable

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getDriveClient() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Credenciais do Google ausentes. Verifique GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

async function uploadToDrive({ buffer, filename, mimeType, parents }) {
  const drive = getDriveClient();

  // 👉 converte Buffer em Stream
  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents,
    },
    media: {
      mimeType,
      body: stream, // 👈 stream, não Buffer
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  return res.data;
}

async function makeFilePublic(fileId) {
  const drive = getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  const { data } = await drive.files.get({
    fileId,
    fields: 'id, name, webViewLink, webContentLink',
  });
  return data;
}

module.exports = { uploadToDrive, makeFilePublic };
