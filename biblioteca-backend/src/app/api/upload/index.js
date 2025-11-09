// src/app/api/upload/index.js

const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const { getDriveWithOAuth } = require('../../../lib/googleOAuth');
// NOVO: Importar a conexão com o banco
const connection = require('../../../config/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// A rota '/api/upload' agora está protegida pelo 'isAuthenticated' no app.js
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // 1. VERIFICAÇÕES (Arquivo e Usuário)
    // -------------------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }
    // Graças ao middleware no app.js, o req.user está disponível
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Sessão inválida.' });
    }

    // 2. LÓGICA DO GOOGLE DRIVE (O que você já tinha)
    // -------------------------------------------------------------------
    const { tipo, ...meta } = req.body; // 'meta' contém titulo, descricao, etc.
    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    const drive = getDriveWithOAuth();
    const stream = Readable.from(buffer);

    // Garante que o ID da pasta "Pendentes" existe
    const pendentesId = process.env.GOOGLE_DRIVE_PENDENTES_ID;
    if (!pendentesId) {
      throw new Error('ID da pasta "Pendentes" não configurado no .env');
    }

    const { data: file } = await drive.files.create({
      requestBody: { name: filename, parents: [pendentesId] },
      media: { mimeType, body: stream },
      fields: 'id, name', // Só precisamos do ID de volta
    });

    // 3. LÓGICA DO BANCO DE DADOS (A parte nova)
    // -------------------------------------------------------------------

    // Pegamos os dados que precisamos para o INSERT
    const googleFileId = file.id; // O ID do arquivo no Google Drive
    const usuarioId = req.user.id; // O ID do usuário logado
    
    // Pegamos os dados do formulário (que estão em 'meta')
    // O seu formulário envia 'titulo', mas a tabela espera 'titulo_proposto'
    const { titulo, descricao } = meta; 

    const sql = `
      INSERT INTO dg_submissoes (
        usuario_id,
        titulo_proposto,
        descricao,
        caminho_anexo,
        status,
        data_submissao
      ) VALUES (?, ?, ?, ?, 'pendente', NOW());
    `;

    // O 'caminho_anexo' agora armazena o 'googleFileId'
    const values = [
      usuarioId,
      titulo, // Mapeado para 'titulo_proposto'
      descricao || null, // Caso a descrição seja opcional
      googleFileId
    ];

    // Executa a query
    await connection.execute(sql, values);

    // 4. SUCESSO
    // -------------------------------------------------------------------
    res.json({
      success: true,
      message: 'Submissão registrada com sucesso!',
      driveFileId: googleFileId
    });

  } catch (err) {
    // 5. ERRO
    // -------------------------------------------------------------------
    console.error('Erro no upload ou ao salvar no DB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;