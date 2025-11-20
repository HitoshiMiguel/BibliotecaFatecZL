// src/app/api/upload/index.js

const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const { getDriveWithOAuth } = require('../../../lib/googleOAuth');
const { poolSistemaNovo: pool } = require('../../../infra/db/mysql/connection');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// A rota '/api/upload' já está protegida pelo 'isAuthenticated' no app.js
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // 1. VERIFICAÇÕES (Arquivo e Usuário)
    // -------------------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Sessão inválida.' });
    }

    // 2. LÓGICA DO GOOGLE DRIVE
    // -------------------------------------------------------------------
    const { tipo, ...meta } = req.body; 
    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    const drive = getDriveWithOAuth();
    const stream = Readable.from(buffer);

    const pendentesId = process.env.GOOGLE_DRIVE_PENDENTES_ID;
    if (!pendentesId) {
      throw new Error('ID da pasta "Pendentes" não configurado no .env');
    }

    const { data: file } = await drive.files.create({
      requestBody: { name: filename, parents: [pendentesId] },
      media: { mimeType, body: stream },
      fields: 'id, name',
    });

    // 3. LÓGICA DO BANCO DE DADOS (ATUALIZADA)
    // -------------------------------------------------------------------
    const googleFileId = file.id;
    const usuarioId = req.user.id;
    
    // NOVO: Pega todos os campos do 'meta' (req.body)
    const {
      titulo,
      descricao,
      autor,
      editora,
      anoPublicacao, // Vem de Artigo/Livro
      conferencia,
      periodico,
      instituicao,
      orientador,
      curso,
      anoDefesa // Vem de TCC
    } = meta;

    // NOVO: O comando SQL agora inclui todas as novas colunas
    const sql = `
      INSERT INTO dg_submissoes (
        usuario_id,
        titulo_proposto,
        descricao,
        caminho_anexo,
        status,
        data_submissao,
        
        -- Novas colunas --
        autor,
        editora,
        ano_publicacao,
        conferencia,
        periodico,
        instituicao,
        orientador,
        curso,
        ano_defesa,
        tipo
      ) VALUES (?, ?, ?, ?, 'pendente', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // NOVO: O array de valores agora inclui todas as novas variáveis
    const values = [
      usuarioId,
      titulo, // (para titulo_proposto)
      descricao || null,
      googleFileId, // (para caminho_anexo)
      
      // Novos valores (ou null se não forem preenchidos)
      autor || null,
      editora || null,
      anoPublicacao || null, // Salva o 'anoPublicacao' (de Livro/Artigo)
      conferencia || null,
      periodico || null,
      instituicao || null,
      orientador || null,
      curso || null,
      anoDefesa || null,
      tipo || null
    ];

    await pool.execute(sql, values);
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