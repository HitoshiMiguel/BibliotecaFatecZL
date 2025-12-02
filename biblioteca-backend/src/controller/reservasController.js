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

    // Cálculo da Data de devolução

    const dataRef = new Date(dataRetirada);

    dataRef.setDate(dataRef.getDate() + 7);

    const dataPrevistaDevolucao = dataRef.toISOString().split('T')[0];

    // COMMAND → O controller só dispara um comando
    const command = new CriarReservaCommand({
      usuarioId,
      submissaoId,
      dataRetirada,
      dataPrevistaDevolucao,
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
 * [NOVO] GET /api/reservas/usuario/atual
 * Busca se o usuário tem algum livro reservado ou com ele agora
 * ============================================================
 */
const getEmprestimoAtivo = async (req, res) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // Chama o novo método do service
    const emprestimo = await reservasService.buscarEmprestimoAtivoPorUsuario(usuarioId);

    if (!emprestimo) {
      // Ativo: false indica para o frontend mostrar "Nenhum livro"
      return res.status(200).json({ ativo: false, mensagem: "Nenhum livro pendente." });
    }

    return res.status(200).json({
      ativo: true,
      dados: {
        titulo: emprestimo.titulo,
        data_devolucao: emprestimo.data_prevista_devolucao,
        data_retirada: emprestimo.data_prevista_retirada,
        status: emprestimo.status // 'ativa' ou 'atendida'
      }
    });

  } catch (err) {
    console.error('[ReservasController] ERRO getEmprestimoAtivo:', err.message);
    return res.status(500).json({ message: 'Erro ao buscar empréstimo ativo.' });
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
 * POST /api/reservas/:id/renovar
 * Usuário solicita renovação de sua reserva/empréstimo.
 */
const renovarReserva = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const { id } = req.params;

    if (!usuarioId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const resultado = await reservasService.renovarReserva(Number(id), usuarioId);

    return res.status(200).json({
      message: 'Renovação efetuada com sucesso.',
      novaDataDevolucao: resultado.novaDataDevolucao,
      renovacoes: resultado.renovacoes
    });
  } catch (err) {
    console.error('[ReservasController] ERRO renovarReserva:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({ message: err.message || 'Falha ao renovar reserva.' });
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
  getEmprestimoAtivo,
  renovarReserva, // <-- adicionado
};
