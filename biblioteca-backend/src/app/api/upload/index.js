const express = require('express');
const multer = require('multer');
const { uploadToDrive, makeFilePublic } = require('../../../lib/googleDrive');

// Router e Multer (buffer em memória)
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }

    const { tipo, ...meta } = req.body;

    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    const parents = [];
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) parents.push(process.env.GOOGLE_DRIVE_FOLDER_ID);

    const driveFile = await uploadToDrive({
      buffer,
      filename,
      mimeType,
      parents,
    });

    // Se quiser deixar público por link, descomente:
    // const publicFile = await makeFilePublic(driveFile.id);

    return res.json({
      success: true,
      tipo,
      meta,
      driveFile, // ou publicFile se usar makeFilePublic
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
