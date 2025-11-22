// src/controller/reservasController.js

const reservasService = require('../services/reservasService');
const CriarReservaCommand = require('../services/CriarReservaCommand');

/**
 * ============================================================
 *  POST /api/reservas
 *  Criação de reserva pelo usuário comum
 *  (Aplicando o padrão Command + Mediator)
 * ============================================================
 */
const criarReserva = async (req, res) => {
  try {
    const usuarioId = req.user?.id; // vem do authMiddleware
    const { submissaoId, dataRetirada } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!submissaoId || !dataRetirada) {
      return res
        .status(400)
        .json({ message: 'submissaoId e dataRetirada são obrigatórios.' });
    }

    // COMMAND → O controller só dispara um comando
    const command = new CriarReservaCommand({
      usuarioId,
      submissaoId,
      dataRetirada,
    });

    const reservaCriada = await command.execute();

    return res.status(201).json({
      message: 'Reserva criada com sucesso.',
      reserva: reservaCriada,
    });
  } catch (err) {
    console.error('[ReservasController] ERRO criarReserva:', err);

    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.message || 'Falha ao criar reserva.',
    });
  }
};

/**
 * ============================================================
 *  GET /api/reservas/minhas
 *  Listar reservas do usuário logado
 * ============================================================
 */
const listarMinhasReservas = async (req, res) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const reservas = await reservasService.listarPorUsuario(usuarioId);
    return res.json(reservas);
  } catch (err) {
    console.error(
      '[ReservasController] ERRO listarMinhasReservas:',
      err.message
    );
    return res.status(500).json({ message: 'Falha ao listar reservas.' });
  }
};

/**
 * ============================================================
 *  A PARTIR DAQUI: ROTAS DO ADMIN/BIBLIOTECÁRIO
 *  (Ainda no mesmo controller por enquanto)
 * ============================================================
 */

const listarTodasReservas = async (req, res) => {
  try {
    const reservas = await reservasService.listarTodas();
    return res.json(reservas);
  } catch (err) {
    console.error(
      '[ReservasController] ERRO listarTodasReservas:',
      err.message
    );
    return res
      .status(500)
      .json({ message: 'Falha ao listar todas as reservas.' });
  }
};

const atenderReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const afetadas = await reservasService.atualizarStatus(id, 'atendida');

    if (afetadas === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    return res.json({ message: 'Reserva marcada como atendida.' });
  } catch (err) {
    console.error('[ReservasController] ERRO ao atender reserva:', err.message);
    return res.status(500).json({ message: 'Falha ao atualizar reserva.' });
  }
};

const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const afetadas = await reservasService.atualizarStatus(id, 'cancelada');

    if (afetadas === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    return res.json({ message: 'Reserva cancelada.' });
  } catch (err) {
    console.error('[ReservasController] ERRO ao cancelar reserva:', err.message);
    return res.status(500).json({ message: 'Falha ao atualizar reserva.' });
  }
};

/**
 * ============================================================
 *  EXPORTAÇÃO FINAL — AGORA SIM COMPLETA
 * ============================================================
 */
module.exports = {
  criarReserva,
  listarMinhasReservas,
  listarTodasReservas,
  atenderReserva,
  cancelarReserva,
};
