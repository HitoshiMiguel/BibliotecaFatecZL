// src/services/UserBuilder.js

const Usuario = require('../model/Usuario');

class UsuarioBuilder {
    constructor(nome, email, senhaHash) { // senhaHash pode ser null
        if (!nome || !email) throw new Error("Nome e Email são obrigatórios.");
        this.props = { nome, email, senhaHash: senhaHash || null, perfil: null, ra: null, tokenAtivacao: null, statusConta: 'ativa' };
    }

    // Aluno: Requer RA e Senha, entra Ativo
    comoAluno(ra) {
        if (!ra) throw new Error("RA é obrigatório para Aluno.");
        if (!this.props.senhaHash) throw new Error("Senha é obrigatória para Aluno.");
        this.props.perfil = "comum"; this.props.ra = ra; this.props.tokenAtivacao = null; this.props.statusConta = 'ativa';
        return this;
    }

    // Professor (Pendente): Requer Token, Senha Null, entra Pendente Ativação
    comoProfessorPendente(tokenAtivacao) {
        if (!tokenAtivacao) throw new Error("Token de ativação é obrigatório para Professor pendente.");
        this.props.perfil = "professor"; this.props.ra = null; this.props.senhaHash = null; this.props.tokenAtivacao = tokenAtivacao; this.props.statusConta = 'pendente_ativacao';
        return this;
    }

    // Professor (Confirmacao): Requer SenhaHash e Token, entra Ativo
    comoProfessorConfirmacao(tokenConfirmacao) {
        if (!this.props.senhaHash) throw new Error("Hash de senha é necessário para Professor confirmado.");
        this.props.perfil = "professor"; this.props.ra = null; this.props.tokenAtivacao = tokenConfirmacao || null; // Token para confirmar email
        this.props.statusConta = 'ativa'; // Já entra ativo
        return this;
    }

    // Bibliotecário: Requer Senha, entra Ativo
    comoBibliotecario() {
         if (!this.props.senhaHash) throw new Error("Senha é obrigatória para Bibliotecário.");
         this.props.perfil = "bibliotecario"; this.props.ra = null; this.props.tokenAtivacao = null; this.props.statusConta = 'ativa';
         return this;
    }

    // Admin: Requer Senha, entra Ativo
    comoAdmin() {
         if (!this.props.senhaHash) throw new Error("Senha é obrigatória para Admin.");
         this.props.perfil = "admin"; this.props.ra = null; this.props.tokenAtivacao = null; this.props.statusConta = 'ativa';
         return this;
    }

    build() {
        if (!this.props.perfil) throw new Error("Perfil não definido.");
        return new Usuario(this.props);
    }
}

module.exports = UsuarioBuilder;