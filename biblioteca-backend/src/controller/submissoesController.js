// src/controller/submissoesController.js
const { poolSistemaNovo: pool } = require('../infra/db/mysql/connection'); // ajuste se seu connection exporta outro nome

/**
 * GET /api/submissoes/minhas
 * Lista últimas submissões do usuário autenticado.
 */
async function listarMinhasSubmissoes(req, res, next) {
  try {
    // middleware de auth deve prover req.user ou req.session.userId — adaptar se for diferente
    const usuarioId = req.user?.usuario_id || req.user?.id || req.session?.userId || req.cookies?.userId;

    if (!usuarioId) {
      // se seu sistema usa token e middleware já popula req.user, essa rotina normaliza.
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const sql = `
      SELECT
        submissao_id,
        usuario_id,
        titulo_proposto,
        descricao,
        caminho_anexo,
        status,
        revisado_por_id,
        data_submissao,
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
      FROM dg_submissoes
      WHERE usuario_id = ?
      ORDER BY data_submissao DESC
      LIMIT 50
    `;
    const [rows] = await pool.query(sql, [usuarioId]);

    // Normaliza nomes para o front (opcional)
    const normalized = (rows || []).map(r => ({
      submissao_id: r.submissao_id,
      usuario_id: r.usuario_id,
      titulo_proposto: r.titulo_proposto,
      descricao: r.descricao,
      caminho_anexo: r.caminho_anexo,
      status: r.status,
      revisado_por_id: r.revisado_por_id,
      data_submissao: r.data_submissao,
      autor: r.autor,
      editora: r.editora,
      ano_publicacao: r.ano_publicacao,
      conferencia: r.conferencia,
      periodico: r.periodico,
      instituicao: r.instituicao,
      orientador: r.orientador,
      curso: r.curso,
      ano_defesa: r.ano_defesa,
      tipo: r.tipo
    }));

    return res.json(normalized);
  } catch (err) {
    console.error('[submissoesController] erro listarMinhasSubmissoes:', err);
    return next(err); // seu errorHandler cuidará
  }
}

module.exports = { listarMinhasSubmissoes };
