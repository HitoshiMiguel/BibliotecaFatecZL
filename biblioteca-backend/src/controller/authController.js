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

// --- FUNÇÃO DE CADASTRO (COM BUILDER e HASH na Solicitação) ---
const postCadastro = async (req, res) => {
    const { nome, ra, email, senha, perfilSolicitado } = req.body;

    try {
        if (!nome || !email || !senha || !perfilSolicitado) { // perfilSolicitado agora é obrigatório
            return res.status(400).json({ message: 'Todos os campos (incluindo perfil) são obrigatórios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        if (perfilSolicitado === 'professor') {
            // Guarda o hash original na solicitação
            await SolicitacaoModel.createSolicitacao({ nome, email, perfil: 'professor', senhaHash });
            return res.status(202).json({ message: 'Sua solicitação de cadastro como professor foi enviada para aprovação administrativa.' });

        } else if (perfilSolicitado === 'aluno') {
            const builder = new UsuarioBuilder(nome, email, senhaHash); // Passa o hash
            const novoAluno = builder.comoAluno(ra).build(); // Valida RA
            const dadosParaSalvar = novoAluno.getDadosParaDB();

            console.log("VERIFICANDO HASH ANTES DE SALVAR (Aluno):", dadosParaSalvar.senha_hash);
            if (!dadosParaSalvar.senha_hash) throw new Error("Falha na construção do hash da senha.");

            await UserModel.insertUser(dadosParaSalvar);
            res.status(201).json({ message: 'Utilizador Aluno criado com sucesso!' });
        } else {
             return res.status(400).json({ message: 'Perfil solicitado inválido.' });
        }

    } catch (error) {
        console.error("Erro em postCadastro:", error);
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) return res.status(409).json({ message: 'Email ou RA já cadastrado.' });
        if (error.message?.includes('obrigatório')) return res.status(400).json({ message: error.message });
        return res.status(500).json({ message: 'Erro interno no servidor ao criar utilizador.' });
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

/// --- FUNÇÃO PARA ATIVAR CONTA (Recebe Token e Senha) ---
const activateAccount = async (req, res) => {
    const { token, senha } = req.body;

    if (!token || !senha) return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    if (senha.length < 8) return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });

    console.log(`activateAccount: Tentando ativar com token ${token.substring(0,8)}...`);
    try {
        // Encontra pelo token E status PENDENTE
        const user = await UserModel.findByActivationToken(token);

        if (!user) {
            console.log(`activateAccount: Token ${token.substring(0,8)}... inválido ou conta já ativa.`);
            // Verifica se o token existe mas a conta já está ativa (pode ter clicado duas vezes)
            const userAlreadyActive = await UserModel.findByActivationTokenSimplified(token); // Busca sem verificar status
             if(userAlreadyActive && userAlreadyActive.status_conta === 'ativa') {
                 return res.status(400).json({ message: 'Esta conta já foi ativada.' });
             }
            return res.status(400).json({ message: 'Token de ativação inválido ou expirado.' });
        }

        console.log(`activateAccount: Utilizador ${user.usuario_id} encontrado com token.`);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Atualiza senha, status e limpa token
        await UserModel.activateUserAccount(user.usuario_id, senhaHash);

        console.log(`activateAccount: Conta ativada para ${user.usuario_id}.`);
        res.status(200).json({ message: 'Conta ativada e senha definida com sucesso!' });
    } catch (error) {
        console.error('Erro CRÍTICO em activateAccount:', error);
        res.status(500).json({ message: 'Erro interno ao ativar a conta.' });
    }
};

const confirmAccount = async (req, res) => {
    const { token } = req.body; // Recebe apenas o token

    if (!token) {
        return res.status(400).json({ message: 'Token de confirmação é obrigatório.' });
    }
    console.log(`confirmAccount: Tentando confirmar com token ${token.substring(0,8)}...`);

    try {
        // Encontrar utilizador pelo token (sem verificar status)
        const user = await UserModel.findByActivationTokenSimplified(token); // Usa a função que busca só pelo token

        if (!user) {
            // Token não encontrado ou já utilizado/limpo
            console.log(`confirmAccount: Token ${token.substring(0,8)}... inválido ou já utilizado.`);
            // Verifica se o token já foi limpo (utilizador existe mas sem token) - caso de clique duplo
            // Esta verificação pode ser mais complexa se necessário
            return res.status(400).json({ message: 'Token de confirmação inválido ou já utilizado.' });
        }

        // Limpar o token de ativação/confirmação no banco de dados
        await UserModel.clearActivationToken(user.usuario_id);

        console.log(`confirmAccount: Conta confirmada para o utilizador ID: ${user.usuario_id}`);
        res.status(200).json({ message: 'Endereço de e-mail confirmado com sucesso! Você já pode fazer login.' });

    } catch (error) {
        console.error('Erro ao confirmar conta:', error);
        res.status(500).json({ message: 'Erro interno ao confirmar a conta.' });
    }
};

// --- FUNÇÃO PARA ATUALIZAR O PRÓPRIO PERFIL ---

/**
 * Permite que o utilizador logado atualize seus próprios dados (nome, email).
 */
const updateProfile = async (req, res) => {
    // ID do utilizador logado (vem do middleware isAuthenticated)
    const userId = req.user.id;
    // Dados permitidos do corpo da requisição
    const { nome, email } = req.body;
    const profileData = {};

    // Validação básica e construção do objeto de dados
    if (nome !== undefined) {
        if (typeof nome !== 'string' || nome.trim().length < 2) {
            return res.status(400).json({ message: 'Nome inválido (mínimo 2 caracteres).' });
        }
        profileData.nome = nome.trim();
    }
    if (email !== undefined) {
        // Validação simples de email (pode usar express-validator aqui também)
        if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
             return res.status(400).json({ message: 'Formato de e-mail inválido.' });
        }
        profileData.email = email.trim().toLowerCase();
    }

    // Verifica se há algo para atualizar
    if (Object.keys(profileData).length === 0) {
        return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }

    console.log(`-> updateProfile: Utilizador ID ${userId} tentando atualizar com:`, profileData);

    try {
        // --- Verificação de E-mail Duplicado (CRUCIAL se permitir alteração de email) ---
        if (profileData.email) {
            const existingUserWithEmail = await UserModel.findByEmail(profileData.email);
            // Verifica se o email já existe E pertence a OUTRO utilizador
            if (existingUserWithEmail && existingUserWithEmail.usuario_id !== userId) {
                console.log(`updateProfile: Falha - Email ${profileData.email} já em uso por ID ${existingUserWithEmail.usuario_id}`);
                return res.status(409).json({ message: 'Este endereço de e-mail já está em uso por outra conta.' });
            }
        }
        // -----------------------------------------------------------------------------

        // Chama a nova função do Model para atualizar apenas campos permitidos
        const affectedRows = await UserModel.updateUserProfile(userId, profileData);

        if (affectedRows > 0) {
            console.log(`updateProfile: Perfil do utilizador ID ${userId} atualizado.`);
            // Busca os dados atualizados para retornar (opcional)
            const updatedUser = await UserModel.findById(userId);
            delete updatedUser?.senha_hash; // Remove dados sensíveis
            delete updatedUser?.token_ativacao;
            delete updatedUser?.reset_token;
            delete updatedUser?.reset_token_expira;
            return res.status(200).json({ message: 'Perfil atualizado com sucesso.', user: updatedUser });
        } else {
            // Pode acontecer se os dados forem idênticos
             console.log(`updateProfile: Nenhuma linha afetada para ID ${userId}. Dados podem ser idênticos.`);
            return res.status(200).json({ message: 'Nenhuma alteração detetada.' });
        }

    } catch (error) {
        console.error(`Erro CRÍTICO em updateProfile para ID ${userId}:`, error);
         // Erro de duplicação do MySQL (fallback, caso a verificação acima falhe)
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Erro: Email já está em uso.' });
         }
        return res.status(500).json({ message: 'Erro interno ao atualizar o perfil.' });
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
    activateAccount,
    confirmAccount,
    updateProfile, // Garante que está exportado
};