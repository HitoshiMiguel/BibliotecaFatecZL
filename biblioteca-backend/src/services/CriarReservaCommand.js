// src/services/CriarReservaCommand.js

// Importa o mediador que orquestra Usuário + Livro + Reserva
// Aqui assumimos que ReservaMediator exporta UMA INSTÂNCIA (module.exports = new ReservaMediator())
const reservaMediator = require('./ReservaMediator');

/**
 * Command: representa a AÇÃO de criar reserva.
 *
 * O controller não sabe *como* a reserva é criada (regras, integrações),
 * ele só dispara esse comando.
 */
class CriarReservaCommand {
  constructor({ usuarioId, submissaoId, dataRetirada, dataPrevistaDevolucao }) {
    this.usuarioId = usuarioId;
    this.submissaoId = submissaoId; // ex: "LEGACY_105"
    this.dataRetirada = dataRetirada; // "AAAA-MM-DD"
    this.dataPrevistaDevolucao = dataPrevistaDevolucao;
    this.mediator = reservaMediator; // NÃO usamos "new" aqui
  }

  async execute() {
    if (!this.usuarioId) {
      const err = new Error('Usuário não autenticado.');
      err.statusCode = 401;
      throw err;
    }

    if (!this.submissaoId || !this.dataRetirada) {
      const err = new Error(
        'submissaoId e dataRetirada são obrigatórios para criar uma reserva.'
      );
      err.statusCode = 400;
      throw err;
    }

    // Delegamos toda a lógica de orquestração para o Mediator
    return this.mediator.criarReserva({
      usuarioId: this.usuarioId,
      submissaoId: this.submissaoId,
      dataRetirada: this.dataRetirada,
      dataPrevistaDevolucao: this.dataPrevistaDevolucao,
    });
  }
}

module.exports = CriarReservaCommand;
