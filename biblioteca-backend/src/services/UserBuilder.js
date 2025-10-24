// src/services/UserBuilder.js
const Usuario = require('../model/Usuario');

/**
 * Responsável por construir e validar a criação do objeto Usuario com Fluent Interface.
 */
class UsuarioBuilder {
    constructor(nome, email, senhaHash) {
        // Validação de campos obrigatórios no construtor do Builder
        if (!nome || !email) {
            throw new Error("Nome e Email são obrigatórios para criar um usuário.");
        }
        
        // Propriedade interna para armazenar os dados em construção
        this.props = {
            nome,
            email,
            senhaHash, // Pode ser uma hash real ou uma string vazia/nula para ativação
            perfil: null, 
            ra: null,
            tokenAtivacao: null,
            statusConta: 'ativa' // Padrão
        };
    }

    // --- Métodos de Perfil (Aplicam as Regras do Domínio) ---

    comoAluno(ra) {
        if (!ra) {
            throw new Error("RA é obrigatório para um usuário 'comum' (aluno).");
        }
        this.props.perfil = "comum";
        this.props.ra = ra; 
        return this;
    }
    
    // Método usado APENAS pelo AdminController após aprovação
    comoProfessor(tokenAtivacao = null) {
        this.props.perfil = "professor";
        this.props.ra = null; // Garante que professores não têm RA
        
        // Se houver token, define o status como pendente de ativação
        if (tokenAtivacao) {
            this.props.tokenAtivacao = tokenAtivacao;
            this.props.statusConta = 'pendente_ativacao';
            this.props.senhaHash = null; // Garante que não há senha antes da ativação
        }
        return this;
    }

    comoBibliotecario() {
        this.props.perfil = "bibliotecario";
        this.props.ra = null; 
        return this;
    }
    
    comoAdmin() {
        this.props.perfil = "admin";
        this.props.ra = null; 
        return this;
    }

    // --- Outros Métodos Opcionais (Setters) ---
    setStatusConta(status) {
        this.props.statusConta = status;
        return this;
    }
    
    // --- O Método de Construção Final ---
    build() {
        if (!this.props.perfil) {
            throw new Error("É necessário definir o perfil do usuário antes de construir.");
        }
        return new Usuario(this.props);
    }
}

module.exports = UsuarioBuilder;
