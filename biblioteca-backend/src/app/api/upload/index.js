const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const { getDriveWithOAuth } = require('../../../lib/googleOAuth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });

    const { tipo, ...meta } = req.body;
    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    const drive = getDriveWithOAuth();
    const stream = Readable.from(buffer);

    const parents = [];
    const pendentesId = process.env.GOOGLE_DRIVE_PENDENTES_ID;
    if (pendentesId) parents.push(pendentesId);

    const { data: file } = await drive.files.create({
    requestBody: { name: filename, parents }, // 👈 cai em Pendentes
    media: { mimeType, body: stream },
    fields: 'id, name, parents, webViewLink, webContentLink',
    });

    // opcional: liberar leitura por link
    // await drive.permissions.create({ fileId: file.id, requestBody: { role: 'reader', type: 'anyone' } });

    res.json({ success: true, tipo, meta, driveFile: file });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
