// src/controller/adminController.js

const bcrypt = require('bcryptjs');
const UserModel = require('../model/UserModel');
const SolicitacaoModel = require('../model/SolicitacaoModel'); 
const UsuarioBuilder = require('../services/UserBuilder');
const { generateUniqueToken } = require('../services/UserService'); 
const { sendActivationEmail } = require('../services/emailService'); 

// --- 1. FUNÇÕES PARA VISUALIZAR SOLICITAÇÕES ---

/**
 * Lista todas as solicitações de cadastro com status 'pendente'.
 */
const getAllSolicitacoes = async (req, res) => {
    try {
        const solicitacoes = await SolicitacaoModel.getAllPendentes();
        return res.status(200).json(solicitacoes);
    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        return res.status(500).json({ message: 'Erro interno ao buscar solicitações.' });
    }
};

/**
 * Rejeita uma solicitação de cadastro.
 */
const rejeitarSolicitacao = async (req, res) => {
    const { id } = req.params;
    try {
        await SolicitacaoModel.updateStatus(id, 'rejeitado');
        // Opcional: Enviar e-mail notificando o professor sobre a rejeição
        return res.status(200).json({ message: `Solicitação ${id} rejeitada com sucesso.` });
    } catch (error) {
        console.error(`Erro ao rejeitar solicitação ${id}:`, error);
        return res.status(500).json({ message: 'Erro interno ao rejeitar solicitação.' });
    }
};

// --- 2. FUNÇÃO PARA APROVAÇÃO (CRIAÇÃO VIA BUILDER E TOKEN) ---

/**
 * Aprova uma solicitação, cria o usuário final e envia o token de ativação.
 */
const aprovarSolicitacao = async (req, res) => {
    const { id } = req.params;

    try {
        const solicitacao = await SolicitacaoModel.findById(id);

        if (!solicitacao) {
            return res.status(404).json({ message: 'Solicitação não encontrada.' });
        }

        console.log(`DEBUG APROVAÇÃO: Tentando aprovar Solicitação ID ${id}.`);
        console.log("DEBUG APROVAÇÃO: Dados da Solicitação (DB):", solicitacao);
        
        if (solicitacao.email === 'mariasilva@gmail.com') {
             console.error("ALERTA: A SOLICITAÇÃO ID 2 ESTÁ RETORNANDO DADOS DE OUTRO USUÁRIO!");
        }
        
        // 1. Geração do Token de Ativação (UUID)
        const activationToken = generateUniqueToken(); 

        // 2. Construção do Objeto USUARIO usando o BUILDER
        // O hash da senha é nulo, forçando o professor a usar o token para definir a senha.
        const builder = new UsuarioBuilder(solicitacao.nome, solicitacao.email, null);
        
        const novoProfessor = builder
            .comoProfessor(activationToken) // Define perfil 'professor' e o token
            .build();
            
        // 3. Persistência na Tabela Principal (dg_usuarios)
        await UserModel.insertUser(novoProfessor.getDadosParaDB());
        
        // 4. Atualizar Status da Solicitação (para que não apareça mais como pendente)
        await SolicitacaoModel.updateStatus(id, 'aprovado');

        // 5. Envio do E-mail de Ativação
        const activationLink = `${process.env.FRONTEND_URL}/ativar-conta?token=${activationToken}`;
        await sendActivationEmail(novoProfessor.email, activationLink);

        return res.status(200).json({ 
            message: 'Professor aprovado e e-mail de ativação de conta enviado com sucesso.',
            email: novoProfessor.email
        });

    } catch (error) {
        console.error(`Erro ao aprovar solicitação ${id}:`, error);
        // Trata erro de duplicação (se o email já foi usado)
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             await SolicitacaoModel.updateStatus(id, 'rejeitado'); 
             return res.status(409).json({ message: 'Email já cadastrado na base de usuários principal.' });
        }
        return res.status(500).json({ message: 'Erro interno no servidor durante a aprovação.' });
    }
};

// --- 3. CRIAÇÃO DIRETA (ADMINISTRATIVA) ---

/**
 * Cria usuários Admin/Bibliotecário/Comum diretamente pelo painel (com senha fornecida).
 */
const createUsuarioDireto = async (req, res) => {
    const { nome, email, senha, perfil } = req.body; 

    try {
        // 1. Hashing da Senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        
        // 2. Construção do Objeto USUARIO usando o BUILDER
        const builder = new UsuarioBuilder(nome, email, senhaHash);

        // 3. Aplicação do Perfil
        if (perfil === 'bibliotecario') {
            builder.comoBibliotecario();
        } else if (perfil === 'admin') {
            builder.comoAdmin();
        } else {
            // Se o admin tentar criar 'comum', o Builder ainda garante as regras
            builder.comoAluno(req.body.ra || null); 
        }

        const novoUsuario = builder.build();
        
        // 4. Persistência no DB
        await UserModel.insertUser(novoUsuario.getDadosParaDB());

        return res.status(201).json({ 
            message: `Usuário ${perfil} criado com sucesso.`,
            usuario: novoUsuario.email
        });

    } catch (error) {
        console.error("Erro na criação direta de usuário:", error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Email ou RA já cadastrado.' });
         }
        return res.status(500).json({ message: error.message });
    }
};

// --- EXPORTAÇÕES (CORREÇÃO DA REFERENCE ERROR) ---
module.exports = {
    getAllSolicitacoes,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    createUsuarioDireto,
};