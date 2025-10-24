// src/controller/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTAÇÕES NECESSÁRIAS
const UserModel = require('../model/UserModel');
const SolicitacaoModel = require('../model/SolicitacaoModel');
const UsuarioBuilder = require('../services/UserBuilder');

// Importações para redefinição e ativação (verifique se os caminhos estão corretos)
const { generateUniqueToken } = require('../services/UserService');
const { sendResetPasswordEmail, sendActivationEmail } = require('../services/emailService');

// --- FUNÇÃO DE CADASTRO (COM BUILDER) ---
const postCadastro = async (req, res) => {
    // Pega o campo 'perfilSolicitado' para diferenciar os fluxos
    const { nome, ra, email, senha, perfilSolicitado } = req.body;

    try {
        // Validações básicas antes de prosseguir (ex: email, senha)
        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Nome, Email e Senha são obrigatórios.' });
        }

        // Criptografia da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Lógica Condicional: Professor (Solicitação) vs. Aluno (Cadastro Direto)
        if (perfilSolicitado === 'professor') {

            // --- FLUXO 1: PROFESSOR (SOLICITAÇÃO DE APROVAÇÃO) ---

            await SolicitacaoModel.createSolicitacao({
                nome,
                email,
                perfil: 'professor',
            });

            return res.status(202).json({
                message: 'Sua solicitação de cadastro como professor foi enviada para aprovação administrativa.'
            });

        } else {

            // --- FLUXO 2: ALUNO (CADASTRO DIRETO) ---

            // Cria o objeto Usuario usando o Builder
            const builder = new UsuarioBuilder(nome, email, senhaHash);

            // O Builder valida se o RA está presente e define o perfil 'comum'
            const novoAluno = builder.comoAluno(ra)
                                     .build();

            const dadosParaSalvar = novoAluno.getDadosParaDB();

            // LOG DE SEGURANÇA: Verificar se o hash está presente antes de salvar
            console.log("VERIFICANDO HASH ANTES DE SALVAR:", dadosParaSalvar.senha_hash);
            if (!dadosParaSalvar.senha_hash) {
                console.error("ALERTA CRÍTICO: SENHA HASH VAZIA NO OBJETO BUILDER!");
                throw new Error("Falha na construção do hash da senha.");
            }
            // FIM DO LOG DE SEGURANÇA

            // Insere no banco de dados (Tabela dg_usuarios)
            await UserModel.insertUser(dadosParaSalvar);

            res.status(201).json({ message: 'Usuário Aluno criado com sucesso!' });
        }

    } catch (error) {
        console.error("Erro ao criar usuário:", error);

        // Erro de duplicação do MySQL
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(409).json({ message: 'Email ou RA já cadastrado.' });
        }

        // Erro gerado pelo Builder (ex: RA não fornecido para Aluno)
        if (error.message && error.message.includes('obrigatório')) {
             return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- FUNÇÃO DE LOGIN ---
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identificador e senha são obrigatórios.' });
        }

        // Tenta buscar o usuário por email ou RA
        let user = await UserModel.findByEmail(identifier);
        if (!user) {
            user = await UserModel.findByRA(identifier);
        }

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // 1. Verifica se a conta está pendente de ativação (fluxo de professor)
        if (user.status_conta === 'pendente_ativacao' || !user.senha_hash) {
            console.log("DEBUG LOGIN: Senha do DB (Hash):", user.senha_hash);
            console.log("DEBUG LOGIN: Status da Conta:", user.status_conta);

            return res.status(403).json({ message: 'Conta pendente de ativação de senha. Verifique seu e-mail ou aguarde a aprovação administrativa.' });
        }

        // 2. CORREÇÃO: Força o hash do banco a ser uma string antes de comparar
        console.log("DEBUG LOGIN: Comparando senha digitada com hash:", user.senha_hash.toString().substring(0, 10) + '...');

        const isPasswordValid = await bcrypt.compare(password, user.senha_hash.toString());

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // 3. Verifica status de conta inativa
        if (user.status_conta === 'inativa') {
            return res.status(403).json({ message: 'Esta conta está inativa.' });
        }

        // Gera token JWT com perfil (útil para Middlewares de autorização)
        const token = jwt.sign({ id: user.usuario_id, perfil: user.perfil }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use true em produção (HTTPS)
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000, // 8 horas
            path: '/',
        });

        // Retorna o perfil para uso no Frontend
        return res.status(200).json({ message: 'Login realizado com sucesso.', perfil: user.perfil });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- FUNÇÃO PARA VERIFICAR O USUÁRIO LOGADO ---
const getCurrentUser = async (req, res) => {
    try {
        // Assume que req.user foi populado por um middleware JWT
        const userId = req.user.id;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Remove dados sensíveis antes de enviar
        delete user.senha_hash;
        delete user.token_ativacao; // Remove token de ativação, se houver
        delete user.reset_token; // Remove token de reset, se houver
        delete user.reset_token_expira;

        res.status(200).json(user);

    } catch (error) {
        console.error('[getCurrentUser] ERRO CATASTRÓFICO:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};


// --- FUNÇÃO DE LOGOUT ---
const logout = (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
};


// --- FUNÇÕES DE REDEFINIÇÃO DE SENHA ---

/**
 * Solicita a redefinição de senha: gera token e envia email.
 */
const requestResetPassword = async (req, res) => {
    console.log("--- Iniciando requestResetPassword ---"); // LOG 1
    const { email } = req.body;
    console.log("Email recebido:", email); // LOG 2

    // Verificação básica (pode retornar 400 se o email estiver em falta)
    if (!email) {
         console.log("Erro: Email em falta no corpo da requisição."); // LOG 3
         return res.status(400).json({ mensagem: 'O campo E-mail é obrigatório.' });
    }

    try {
        console.log("Procurando utilizador..."); // LOG 4
        const user = await UserModel.findByEmail(email);

        if (user) {
            console.log("Utilizador encontrado:", user.usuario_id); // LOG 5
            // 1. Gerar token (UUID)
            const token = generateUniqueToken();
            const expira = new Date(Date.now() + 3600 * 1000); // 1 hora
            console.log("Token gerado:", token); // LOG 6

            // 2. Atualizar token e expiração no DB
            console.log("Atualizando token no DB para utilizador ID:", user.usuario_id); // LOG 7
            await UserModel.updateResetToken(user.usuario_id, token, expira);
            console.log("Token atualizado no DB."); // LOG 8

            // 3. Gerar link e enviar email
            const link = `${process.env.FRONTEND_URL}/nova-senha?token=${token}`;
            console.log("Enviando e-mail para:", email, "com link:", link); // LOG 9
            await sendResetPasswordEmail(email, link);
            console.log("E-mail enviado com sucesso."); // LOG 10
        } else {
            console.log("Utilizador não encontrado para o email:", email); // LOG 11
        }

        // Sempre retorne 200 para evitar enumerar utilizadores
        console.log("Retornando Status 200."); // LOG 12
        return res.status(200).json({ mensagem: 'Se o e-mail estiver cadastrado, um link de redefinição de senha foi enviado.' });

    } catch (error) {
        console.error('Erro CRÍTICO em requestResetPassword:', error); // LOG ERRO
        // Retorna 500 se qualquer 'await' falhar
        return res.status(500).json({ mensagem: 'Erro interno ao processar a solicitação de redefinição.' });
    }
};

/**
 * Redefine a senha usando o token recebido.
 */
const resetPassword = async (req, res) => {
    const { token, senha } = req.body;

    if (!token || !senha) {
        return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios.' });
    }

    try {
        // 1. Tentar encontrar o usuário pelo token e verificar expiração
        const user = await UserModel.findByResetToken(token);

        if (!user) {
            return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
        }

        // 2. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // 3. Atualizar senha e limpar token
        await UserModel.updatePassword(user.usuario_id, senhaHash);

        res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Erro em resetPassword:', error);
        return res.status(500).json({ mensagem: 'Erro interno ao redefinir a senha.' });
    }
};


// --- EXPORTAÇÕES ---
module.exports = {
    postCadastro,
    login,
    getCurrentUser,
    logout,
    requestResetPassword,
    resetPassword,
};