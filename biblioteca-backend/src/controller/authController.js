// src/controller/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTAÇÕES NECESSÁRIAS
const UserModel = require('../model/UserModel');
const SolicitacaoModel = require('../model/SolicitacaoModel');
const UsuarioBuilder = require('../services/UserBuilder');

// Importações para redefinição e ativação
const { generateUniqueToken } = require('../services/UserService');
const { sendResetPasswordEmail, sendActivationEmail } = require('../services/emailService');

// --- FUNÇÃO DE CADASTRO (COM BUILDER e HASH na Solicitação) ---
const postCadastro = async (req, res) => {
    const { nome, ra, email, senha, perfilSolicitado } = req.body;

    try {
        if (!nome || !email || !senha || !perfilSolicitado) {
            return res.status(400).json({ message: 'Todos os campos (incluindo perfil) são obrigatórios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        if (perfilSolicitado === 'professor') {
            await SolicitacaoModel.createSolicitacao({ nome, email, perfil: 'professor', senhaHash });
            return res.status(202).json({ message: 'Sua solicitação de cadastro como professor foi enviada para aprovação administrativa.' });

        } else if (perfilSolicitado === 'aluno') {
            const builder = new UsuarioBuilder(nome, email, senhaHash);
            const novoAluno = builder.comoAluno(ra).build();
            const dadosParaSalvar = novoAluno.getDadosParaDB();

            if (!dadosParaSalvar.senha_hash) throw new Error("Falha na construção do hash da senha.");

            await UserModel.insertUser(dadosParaSalvar);
            res.status(201).json({ message: 'Usuário Aluno criado com sucesso!' });
        } else {
             return res.status(400).json({ message: 'Perfil solicitado inválido.' });
        }

    } catch (error) {
        console.error("Erro em postCadastro:", error);
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) return res.status(409).json({ message: 'Email ou RA já cadastrado.' });
        if (error.message?.includes('obrigatório')) return res.status(400).json({ message: error.message });
        return res.status(500).json({ message: 'Erro interno no servidor ao criar usuário.' });
    }
};


// --- FUNÇÃO DE LOGIN ---
const login = async (req, res) => {
    try {
        // Recebe o rememberMe do front
        const { identifier, password, rememberMe } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identificador e senha são obrigatórios.' });
        }

        // Busca usuário (Email ou RA)
        let user = await UserModel.findByEmail(identifier);
        if (!user) user = await UserModel.findByRA(identifier);

        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });

        // Verificações de segurança (ativação, inativo, etc...)
        if (user.status_conta === 'pendente_ativacao' || !user.senha_hash) {
            return res.status(403).json({ message: 'Conta pendente de ativação.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.senha_hash.toString());
        if (!isPasswordValid) return res.status(401).json({ message: 'Credenciais inválidas.' });

        if (user.status_conta === 'inativa') {
            return res.status(403).json({ message: 'Esta conta está inativa.' });
        }

        // --- LÓGICA DE EXPIRAÇÃO (ALTERADA) ---
        
        // Configuração base do token (JWT)
        // Se lembrar: 30 dias. Se não: 1 dia (apenas para garantir que não expire enquanto a aba estiver aberta)
       const tokenExpiresIn = rememberMe ? '30d' : '1d'; // Mantemos 1 dia como segurança
        
        const token = jwt.sign(
            { 
                id: user.usuario_id, 
                perfil: user.perfil,
                // Adicionamos esta flag para o Frontend saber o tipo de sessão
                persistente: !!rememberMe 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: tokenExpiresIn }
        );

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        };

        // Se marcou lembrar, define validade longa no cookie
        if (rememberMe) {
            cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; 
        }
        // Se NÃO marcou, deixamos sem maxAge (Cookie de Sessão do navegador)

        res.cookie('token', token, cookieOptions);

        return res.status(200).json({ message: 'Login realizado.', perfil: user.perfil });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};


// --- FUNÇÃO PARA VERIFICAR O USUÁRIO LOGADO ---
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const isPersistente = req.user.persistente;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        delete user.senha_hash;
        delete user.token_ativacao;
        delete user.reset_token;
        delete user.reset_token_expira;

       res.status(200).json({ ...user, persistente: isPersistente });

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
const requestResetPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensagem: 'O campo E-mail é obrigatório.' });

    try {
        const user = await UserModel.findByEmail(email);

        if (user) {
            const token = generateUniqueToken();
            const expira = new Date(Date.now() + 3600 * 1000); // 1 hora
            await UserModel.updateResetToken(user.usuario_id, token, expira);
            const link = `${process.env.FRONTEND_URL}/nova-senha?token=${token}`;
            await sendResetPasswordEmail(email, link);
        }
        return res.status(200).json({ mensagem: 'Se o e-mail estiver cadastrado, um link de redefinição de senha foi enviado.' });

    } catch (error) {
        console.error('Erro CRÍTICO em requestResetPassword:', error);
        return res.status(500).json({ mensagem: 'Erro interno ao processar a solicitação de redefinição.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, senha } = req.body;
    if (!token || !senha) return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios.' });

    try {
        const user = await UserModel.findByResetToken(token);
        if (!user) return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        await UserModel.updatePassword(user.usuario_id, senhaHash);
        res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Erro em resetPassword:', error);
        return res.status(500).json({ mensagem: 'Erro interno ao redefinir a senha.' });
    }
};

// --- ATIVAÇÃO E CONFIRMAÇÃO ---
const activateAccount = async (req, res) => {
    const { token, senha } = req.body;
    if (!token || !senha) return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    if (senha.length < 8) return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });

    try {
        const user = await UserModel.findByActivationToken(token);
        if (!user) {
            const userAlreadyActive = await UserModel.findByActivationTokenSimplified(token);
             if(userAlreadyActive && userAlreadyActive.status_conta === 'ativa') {
                 return res.status(400).json({ message: 'Esta conta já foi ativada.' });
             }
            return res.status(400).json({ message: 'Token de ativação inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        await UserModel.activateUserAccount(user.usuario_id, senhaHash);

        res.status(200).json({ message: 'Conta ativada e senha definida com sucesso!' });
    } catch (error) {
        console.error('Erro CRÍTICO em activateAccount:', error);
        res.status(500).json({ message: 'Erro interno ao ativar a conta.' });
    }
};

const confirmAccount = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token de confirmação é obrigatório.' });

    try {
        const user = await UserModel.findByActivationTokenSimplified(token);
        if (!user) return res.status(400).json({ message: 'Token de confirmação inválido ou já utilizado.' });

        await UserModel.clearActivationToken(user.usuario_id);
        res.status(200).json({ message: 'Endereço de e-mail confirmado com sucesso! Você já pode fazer login.' });
    } catch (error) {
        console.error('Erro ao confirmar conta:', error);
        res.status(500).json({ message: 'Erro interno ao confirmar a conta.' });
    }
};

// --- ATUALIZAÇÃO DE PERFIL ---
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { nome, email } = req.body;
    const profileData = {};

    if (nome !== undefined) {
        if (typeof nome !== 'string' || nome.trim().length < 2) return res.status(400).json({ message: 'Nome inválido.' });
        profileData.nome = nome.trim();
    }
    if (email !== undefined) {
        if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Formato de e-mail inválido.' });
        profileData.email = email.trim().toLowerCase();
    }

    if (Object.keys(profileData).length === 0) return res.status(400).json({ message: 'Nenhum dado fornecido.' });

    try {
        if (profileData.email) {
            const existingUserWithEmail = await UserModel.findByEmail(profileData.email);
            if (existingUserWithEmail && existingUserWithEmail.usuario_id !== userId) {
                return res.status(409).json({ message: 'Este endereço de e-mail já está em uso.' });
            }
        }

        const affectedRows = await UserModel.updateUserProfile(userId, profileData);
        const updatedUser = await UserModel.findById(userId);
        
        if (updatedUser) {
            delete updatedUser.senha_hash;
            delete updatedUser.token_ativacao;
            delete updatedUser.reset_token;
            delete updatedUser.reset_token_expira;
        }

        return res.status(200).json({ message: 'Perfil atualizado com sucesso.', user: updatedUser || {} });

    } catch (error) {
        console.error(`Erro CRÍTICO em updateProfile:`, error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) return res.status(409).json({ message: 'Erro: Email já está em uso.' });
        return res.status(500).json({ message: 'Erro interno ao atualizar o perfil.' });
    }
};

module.exports = {
    postCadastro,
    login,
    getCurrentUser,
    logout,
    requestResetPassword,
    resetPassword,
    activateAccount,
    confirmAccount,
    updateProfile,
};