const express = require('express');
const { getDriveWithOAuth } = require('../../../lib/googleOAuth');

const router = express.Router();

/**
 * Aprova um arquivo: move da pasta Pendentes para Aprovados
 * POST /api/moderation/approve/:fileId
 */
router.post('/approve/:fileId', async (req, res) => {
  try {
    const drive = getDriveWithOAuth();
    const fileId = req.params.fileId;
    const pendentesId = process.env.GOOGLE_DRIVE_PENDENTES_ID;
    const aprovadosId = process.env.GOOGLE_DRIVE_APROVADOS_ID;

    if (!aprovadosId) {
      return res.status(400).json({ success: false, error: 'GOOGLE_DRIVE_APROVADOS_ID não configurado.' });
    }

    // descobre os pais atuais (para remover Pendentes)
    const { data: meta } = await drive.files.get({
      fileId,
      fields: 'id, name, parents',
    });

    const currentParents = (meta.parents || []).join(',');
    // move: add Aprovados, remove os pais atuais (inclui Pendentes)
    const { data: moved } = await drive.files.update({
      fileId,
      addParents: aprovadosId,
      removeParents: currentParents || undefined,
      fields: 'id, name, parents, webViewLink',
    });

    return res.json({ success: true, file: moved });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * (Opcional) Rejeitar: manda para lixeira
 * POST /api/moderation/reject/:fileId
 */
router.post('/reject/:fileId', async (req, res) => {
  try {
    const drive = getDriveWithOAuth();
    const fileId = req.params.fileId;

    const { data: trashed } = await drive.files.update({
      fileId,
      requestBody: { trashed: true },
      fields: 'id, name, trashed',
    });

    return res.json({ success: true, file: trashed });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
