class Usuario {
    constructor(props) {
        this.nome = props.nome;
        this.ra = props.ra || null;
        this.email = props.email;
        this.senhaHash = props.senhaHash;
        this.perfil = props.perfil;

        this.tokenAtivacao = props.tokenAtivacao || null;
        this.statusConta = props.statusConta || 'ativa';
    }

    getDadosParaDB() {
        return {
            nome: this.nome,
            ra: this.ra,
            email: this.email,
            senha_hash: this.senhaHash,
            perfil: this.perfil,
            tokenAtivacao: this.tokenAtivacao,
            statusConta: this.statusConta
        };
    }
}

module.exports = Usuario;