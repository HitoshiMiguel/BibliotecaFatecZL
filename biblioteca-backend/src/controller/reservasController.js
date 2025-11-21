// src/controller/reservasController.js
const reservasService = require('../services/reservasService');

exports.criarReserva = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const { submissaoId, dataRetirada } = req.body;

    if (!submissaoId) {
      return res.status(400).json({ message: 'ID da publicação é obrigatório.' });
    }
    if (!dataRetirada) {
      return res.status(400).json({ message: 'Data de retirada é obrigatória.' });
    }

    const reserva = await reservasService.criarReserva(
      usuarioId,
      submissaoId,
      dataRetirada
    );
    return res.status(201).json({
      message: 'Reserva criada com sucesso.',
      reserva,
    });
  } catch (err) {
    console.error('ERRO ao criar reserva:', err.message);
    if (
      err.message.includes('Somente itens físicos') ||
      err.message.includes('não encontrado') ||
      err.message.includes('não está disponível') ||
      err.message.includes('já possui uma reserva') ||
      err.message.includes('reserva ativa') ||
      err.message.includes('Data de retirada') ||
      err.message.includes('Formato de data')
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Falha ao criar reserva.' });
  }
};

exports.listarMinhasReservas = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const reservas = await reservasService.listarPorUsuario(usuarioId);
    return res.json(reservas);
  } catch (err) {
    console.error('ERRO ao listar reservas do usuário:', err.message);
    return res.status(500).json({ message: 'Falha ao listar reservas.' });
  }
};

exports.listarTodasReservas = async (req, res) => {
  try {
    const reservas = await reservasService.listarTodas();
    return res.json(reservas);
  } catch (err) {
    console.error('ERRO ao listar todas as reservas:', err.message);
    return res.status(500).json({ message: 'Falha ao listar reservas.' });
  }
};

exports.atenderReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const afetadas = await reservasService.atualizarStatus(id, 'atendida');

    if (afetadas === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    return res.json({ message: 'Reserva marcada como atendida.' });
  } catch (err) {
    console.error('ERRO ao atender reserva:', err.message);
    return res.status(500).json({ message: 'Falha ao atualizar reserva.' });
  }
};

exports.cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const afetadas = await reservasService.atualizarStatus(id, 'cancelada');

    if (afetadas === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    return res.json({ message: 'Reserva cancelada.' });
  } catch (err) {
    console.error('ERRO ao cancelar reserva:', err.message);
    return res.status(500).json({ message: 'Falha ao atualizar reserva.' });
  }
};
