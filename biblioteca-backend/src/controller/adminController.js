// src/controller/adminController.js

const bcrypt = require('bcryptjs');
const UserModel = require('../model/UserModel');
const SolicitacaoModel = require('../model/SolicitacaoModel');
const UsuarioBuilder = require('../services/UserBuilder');
const { generateUniqueToken } = require('../services/UserService');
const connection = require('../config/db');
const { getDriveWithOAuth } = require('../lib/googleOAuth');

// --- CORREÇÃO DA IMPORTAÇÃO ---
// Importa a função correta do emailService
const { sendConfirmationEmail, sendActivationEmail } = require('../services/emailService');
const { get } = require('../routes/adminRoutes');
// -----------------------------

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
        const solicitacao = await SolicitacaoModel.findById(id); // Busca para log ou notificação
        if (!solicitacao) {
             return res.status(404).json({ message: 'Solicitação não encontrada para rejeitar.' });
        }
        await SolicitacaoModel.updateStatus(id, 'rejeitado');
        console.log(`Solicitação ${id} (${solicitacao.email}) rejeitada.`);
        // Opcional: Enviar e-mail notificando o professor sobre a rejeição
        return res.status(200).json({ message: `Solicitação ${id} rejeitada com sucesso.` });
    } catch (error) {
        console.error(`Erro ao rejeitar solicitação ${id}:`, error);
        return res.status(500).json({ message: 'Erro interno ao rejeitar solicitação.' });
    }
};

// --- 2. FUNÇÃO PARA APROVAÇÃO (CRIAÇÃO VIA BUILDER E CONFIRMAÇÃO) ---

/**
 * Aprova uma solicitação (Professor), cria o utilizador com senha ORIGINAL e envia email de CONFIRMAÇÃO.
 */
const aprovarSolicitacao = async (req, res) => {
    // Garante que 'id' é extraído corretamente de req.params
    const { id } = req.params; 
    console.log(`-> aprovarSolicitacao: Iniciando para ID da URL: ${id}`); // Log inicial do ID

    // Verifica se o ID foi realmente extraído
    if (!id) {
        console.error("Erro em aprovarSolicitacao: ID não encontrado nos parâmetros da rota.");
        return res.status(400).json({ message: 'ID da solicitação ausente na URL.' });
    }

    try {
        // Usa o 'id' extraído para buscar a solicitação
        const solicitacao = await SolicitacaoModel.findById(id); 
        if (!solicitacao) return res.status(404).json({ message: 'Solicitação não encontrada.' });
        if (solicitacao.status !== 'pendente') return res.status(400).json({ message: 'Esta solicitação já foi processada.' });
        if (!solicitacao.senha_hash) return res.status(500).json({ message: 'Erro interno: dados da solicitação incompletos (sem hash).' });

        const senhaHashOriginal = solicitacao.senha_hash;
        console.log(`DEBUG APROVAÇÃO: Tentando aprovar Solicitação ID ${id}. Hash original recuperado.`);
        console.log("DEBUG APROVAÇÃO: Dados da Solicitação:", solicitacao);

        const existingUser = await UserModel.findByEmail(solicitacao.email);
        if (existingUser) {
             console.log(`Aprovação falhou: Email ${solicitacao.email} já existe na tabela dg_usuarios.`);
             await SolicitacaoModel.updateStatus(id, 'rejeitado'); // Usa o id aqui
             return res.status(409).json({ message: `Email (${solicitacao.email}) já cadastrado na base de utilizadores principal.` });
        }

        const confirmationToken = generateUniqueToken();
        console.log("DEBUG APROVAÇÃO: Token de confirmação gerado:", confirmationToken);

        const builder = new UsuarioBuilder(solicitacao.nome, solicitacao.email, senhaHashOriginal);
        const novoProfessor = builder
            .comoProfessorConfirmacao(confirmationToken)
            .build();

        console.log("DEBUG APROVAÇÃO: Objeto Professor a ser inserido:", novoProfessor.getDadosParaDB());
        await UserModel.insertUser(novoProfessor.getDadosParaDB());

        // Log antes de atualizar o status para confirmar que 'id' está definido
        console.log(`DEBUG APROVAÇÃO: Atualizando status da Solicitação ID ${id} para 'aprovado'.`); 
        await SolicitacaoModel.updateStatus(id, 'aprovado'); // Usa o id aqui (linha ~73-76)

        const confirmationLink = `${process.env.FRONTEND_URL}/confirmar-conta?token=${confirmationToken}`;
        await sendConfirmationEmail(novoProfessor.email, confirmationLink);

        return res.status(200).json({
            message: 'Professor aprovado. E-mail de confirmação enviado.',
            email: novoProfessor.email
        });

    } catch (error) {
        // Garante que o 'id' (definido no escopo externo do try) esteja acessível aqui
        console.error(`Erro CRÍTICO ao aprovar solicitação ${id}:`, error); // Usa o id aqui
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             // Tenta usar o id aqui também, mas cuidado se 'solicitacao' for undefined
             const emailErro = solicitacao?.email || `da solicitação ${id}`; 
             await SolicitacaoModel.updateStatus(id, 'rejeitado'); // Usa o id aqui
             return res.status(409).json({ message: `Email (${emailErro}) já cadastrado.` });
        }
        return res.status(500).json({ message: 'Erro interno no servidor durante a aprovação.' });
    }
};

const listAllUsers = async (req, res) => {
    console.log("-> listAllUsers acionado"); // Log de entrada
    try {
        const users = await UserModel.getAllUsers();
        // Remove senha_hash e tokens por segurança antes de enviar (getAllUsers já faz isso)
        res.status(200).json(users);
    } catch (error) {
        console.error('Erro ao listar utilizadores:', error);
        res.status(500).json({ message: 'Erro interno ao buscar utilizadores.' });
    }
};

/**
 * Obtém detalhes de um utilizador específico pelo ID (Read One).
 */
const getUserById = async (req, res) => {
    const { id } = req.params;
    console.log(`-> getUserById acionado para ID: ${id}`); // Log de entrada
    try {
        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        // Remove dados sensíveis antes de enviar
        delete user.senha_hash;
        delete user.token_ativacao;
        delete user.reset_token;
        delete user.reset_token_expira;
        res.status(200).json(user);
    } catch (error) {
        console.error(`Erro ao buscar utilizador ${id}:`, error);
        res.status(500).json({ message: 'Erro interno ao buscar detalhes do utilizador.' });
    }
};

/**
 * Atualiza os dados de um utilizador (Update).
 */
const updateUser = async (req, res) => {
    const { id } = req.params;
    // Pega os campos do corpo da requisição que podem ser atualizados
    const { nome, email, ra, perfil, status_conta } = req.body;
    const updateData = { nome, email, ra, perfil, status_conta };

    // Remove campos undefined para evitar sobrescrever com null acidentalmente
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    console.log(`-> updateUser acionado para ID: ${id} com dados:`, updateData);

    // Validação 1: Nenhum dado fornecido
    if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }

    try {
        // Busca o utilizador atual para verificações
        const currentUser = await UserModel.findById(id);
        if (!currentUser) {
            return res.status(404).json({ message: 'Utilizador não encontrado para atualização.' });
        }

        // --- VALIDAÇÃO 2: REGRA DO RA PARA PERFIL 'COMUM' ---
        // Determina qual será o perfil final (o novo, se fornecido, ou o atual)
        const finalProfile = updateData.perfil || currentUser.perfil;
        // Determina qual será o RA final (o novo, se fornecido, ou o atual)
        // Trata "" como null para consistência
        const finalRa = (updateData.ra === "" || updateData.ra === undefined) ? currentUser.ra : updateData.ra; 
        const effectiveRa = (finalRa === null || finalRa === undefined) ? '' : String(finalRa).trim(); // Garante que é string para .length

        if (finalProfile === 'comum') {
            // Se o perfil final é 'comum', o RA é obrigatório e deve ter 13 dígitos numéricos
            if (!effectiveRa) {
                return res.status(400).json({ message: 'O campo RA é obrigatório para utilizadores do tipo Comum (Aluno).' });
            }
            if (effectiveRa.length !== 13 || !/^\d+$/.test(effectiveRa)) {
                 return res.status(400).json({ message: 'O RA deve conter exatamente 13 dígitos numéricos para o perfil Comum.' });
            }
            // Garante que o valor enviado para o DB seja a string validada ou null
            updateData.ra = effectiveRa; 
        } else {
             // Se o perfil final NÃO é 'comum', o RA DEVE ser NULL
             updateData.ra = null; // Força RA como null para outros perfis
        }
        // --------------------------------------------------------

        // Validação 3: Segurança (Impedir auto-rebaixamento/inativação)
        const adminUserId = req.user.id;
        if (parseInt(id, 10) === adminUserId) {
            // ... (lógica de segurança mantida como antes)
             if (updateData.perfil && updateData.perfil !== 'admin') {
                 return res.status(403).json({ message: 'Não é permitido alterar o próprio perfil para um nível inferior.' });
             }
             if (updateData.status_conta && updateData.status_conta !== 'ativa') {
                 return res.status(403).json({ message: 'Não é permitido inativar a própria conta.' });
             }
        }

        // Validação 4: Duplicação de Email/RA (ANTES de atualizar)
        if (updateData.email && updateData.email !== currentUser.email) {
            // ... (verificação de email duplicado mantida)
             const emailInUse = await UserModel.findByEmail(updateData.email);
             if (emailInUse) return res.status(409).json({ message: 'O novo e-mail fornecido já está em uso.' });
        }
        // Só verifica RA duplicado se o perfil for 'comum' e o RA foi alterado
        if (finalProfile === 'comum' && updateData.ra && updateData.ra !== currentUser.ra) {
            // ... (verificação de RA duplicado mantida)
              const raInUse = await UserModel.findByRA(updateData.ra);
              if (raInUse) return res.status(409).json({ message: 'O novo RA fornecido já está em uso.' });
        }

        // --- ATUALIZAÇÃO NO BANCO ---
        // A função updateUserById já trata "" como NULL se necessário
        const affectedRows = await UserModel.updateUserById(id, updateData); 

        if (affectedRows === 0 && Object.keys(updateData).length > 0) {
            console.log(`Nenhuma linha atualizada para ID: ${id}. Dados podem ser idênticos.`);
            return res.status(200).json({ message: 'Nenhuma alteração detetada.' });
        }

        res.status(200).json({ message: 'Utilizador atualizado com sucesso.' });

    } catch (error) {
        console.error(`Erro ao atualizar utilizador ${id}:`, error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Erro: Email ou RA já está em uso por outro utilizador.' });
         }
        res.status(500).json({ message: 'Erro interno ao atualizar utilizador.' });
    }
}

/**
 * Exclui um utilizador (Delete).
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.id; // ID do admin logado

    console.log(`-> deleteUser acionado para ID: ${id} por Admin ID: ${adminUserId}`);

    // Segurança: Impedir que o admin se exclua
    if (parseInt(id, 10) === adminUserId) {
        return res.status(403).json({ message: 'Não é permitido excluir a própria conta.' });
    }

    let userEmail = null; // Variável para guardar o email antes de excluir

    try {
        // 1. Busca o utilizador para obter o email ANTES de excluir
        const userToDelete = await UserModel.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Utilizador não encontrado para exclusão.' });
        }
        userEmail = userToDelete.email; // Guarda o email

        // 2. Exclui o utilizador principal da tabela dg_usuarios
        const affectedRowsUser = await UserModel.deleteUserById(id);

        if (affectedRowsUser === 0) {
            // Isso não deveria acontecer se a busca acima funcionou
             console.log(`deleteUser: Nenhuma linha excluída em dg_usuarios para ID: ${id}. Inesperado.`);
             // Ainda assim, tenta limpar a solicitação por segurança
        } else {
             console.log(`deleteUser: Utilizador ID ${id} excluído de dg_usuarios.`);
        }

        // --- NOVA ETAPA: Excluir solicitação correspondente ---
        if (userEmail) {
            console.log(`deleteUser: Tentando excluir solicitação associada ao email: ${userEmail}`);
            await SolicitacaoModel.deleteSolicitacaoByEmail(userEmail);
            // Não verificamos o resultado aqui, pois a solicitação pode não existir (ex: Aluno)
        }
        // ---------------------------------------------------

        res.status(200).json({ message: 'Utilizador e solicitações associadas (se existirem) excluídos com sucesso.' });

    } catch (error) {
        console.error(`Erro ao excluir utilizador ${id} ou solicitação associada:`, error);
        // Tratar erros de chave estrangeira (se aplicável, embora a exclusão da solicitação deva ocorrer após)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Não é possível excluir este utilizador pois ele possui registos associados (ex: submissões).' });
        }
        res.status(500).json({ message: 'Erro interno ao excluir utilizador.' });
    }
};

// --- 3. CRIAÇÃO DIRETA (ADMINISTRATIVA) - Professor usa fluxo de ATIVAÇÃO ---

const createUsuarioDireto = async (req, res) => {
    // Para professor, a senha do form será IGNORADA.
    const { nome, email, senha, perfil, ra } = req.body;

    // Validações básicas
    if (!nome || !email || !perfil) {
        return res.status(400).json({ message: 'Nome, Email e Perfil são obrigatórios.' });
    }
    // Senha só é obrigatória se NÃO for professor
    if (perfil !== 'professor' && (!senha || senha.length < 8)) {
        return res.status(400).json({ message: 'Senha inválida (mínimo 8 caracteres) é obrigatória para este perfil.' });
    }
    if (perfil === 'comum' && (!ra || ra.length !== 13 || !/^\d+$/.test(ra))) {
        return res.status(400).json({ message: 'RA inválido (13 dígitos numéricos) é obrigatório para Aluno.' });
    }

    try {
        // Verifica duplicações ANTES de prosseguir
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) return res.status(409).json({ message: `Email (${email}) já cadastrado.` });
        if (perfil === 'comum' && ra) {
            const existingRa = await UserModel.findByRA(ra);
            if(existingRa) return res.status(409).json({ message: `RA (${ra}) já cadastrado.` });
        }

        let senhaHash = null;
        let activationToken = null; // Token para professor

        // --- LÓGICA CONDICIONAL PARA PROFESSOR ---
        if (perfil === 'professor') {
            activationToken = generateUniqueToken(); // Gera token de ativação
            // senhaHash permanece null
            console.log("createUsuarioDireto: Perfil Professor detectado. Gerando token de ativação:", activationToken);
        } else {
            // Hash da senha para Aluno, Admin, Biblio
            const salt = await bcrypt.genSalt(10);
            senhaHash = await bcrypt.hash(senha, salt);
            console.log("createUsuarioDireto: Perfil não-professor. Gerando hash da senha.");
        }
        // -----------------------------------------

        // Construção do Objeto USUARIO usando o BUILDER
        // Passa null como senhaHash se for professor
        const builder = new UsuarioBuilder(nome, email, senhaHash);

        // Aplicação do Perfil via Builder
        if (perfil === 'bibliotecario') {
            builder.comoBibliotecario();
        } else if (perfil === 'admin') {
            builder.comoAdmin();
        } else if (perfil === 'comum') {
            builder.comoAluno(ra);
        } else if (perfil === 'professor') {
             // Chama o método que define status PENDENTE e guarda o token
             builder.comoProfessorPendente(activationToken);
             console.log("createUsuarioDireto: Chamando builder.comoProfessorPendente.");
        } else {
             // Este caso não deve acontecer devido à validação inicial, mas por segurança
             return res.status(400).json({ message: "Perfil inválido fornecido." });
        }

        const novoUsuario = builder.build();
        const dadosParaSalvar = novoUsuario.getDadosParaDB();
        console.log("DEBUG createUsuarioDireto - Objeto a inserir:", dadosParaSalvar);

        // Persistência no DB
        await UserModel.insertUser(dadosParaSalvar);

        // --- ENVIO DE EMAIL APENAS PARA PROFESSOR ---
        if (perfil === 'professor') {
            const activationLink = `${process.env.FRONTEND_URL}/ativar-conta?token=${activationToken}`;
            console.log("createUsuarioDireto: Enviando e-mail de ativação para:", email);
            await sendActivationEmail(email, activationLink); // Envia email de ATIVAÇÃO
             return res.status(201).json({
                message: `Utilizador Professor criado. E-mail de ativação enviado para ${email}.`,
                usuario: novoUsuario.email
            });
        }
        // --------------------------------------------

        // Resposta para outros perfis (Aluno, Admin, Biblio)
        return res.status(201).json({
            message: `Utilizador ${perfil} criado com sucesso.`,
            usuario: novoUsuario.email
        });

    } catch (error) {
         console.error("Erro CRÍTICO na criação direta de utilizador:", error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Email ou RA já cadastrado (erro DB).' });
         }
         // Captura erros do Builder (ex: RA em falta, token em falta)
         if (error.message && (error.message.includes('obrigatório') || error.message.includes('Token') || error.message.includes('Senha'))) {
             return res.status(400).json({ message: error.message });
         }
        return res.status(500).json({ message: 'Erro interno no servidor ao criar utilizador.' });
    }
};

// --- NOVO MÉTODO PARA SUBMISSÕES ---

// GET /api/admin/submissoes/pendentes
const getSubmissoesPendentes = async (req, res, next) => {
  let pool; // Usado para garantir que a conexão seja tratada
  try {
    // 2. Definir a query SQL
    const sql = `
      SELECT
        s.submissao_id,
        s.titulo_proposto,
        s.descricao,
        s.data_submissao,
        u.nome AS nome_remetente
      FROM
        dg_submissoes s
      JOIN
        dg_usuarios u ON s.usuario_id = u.usuario_id
      WHERE
        s.status = 'pendente'
      ORDER BY
        s.data_submissao ASC;
    `;

    // 3. Executar a query
    // (Assumindo que você usa mysql2/promise, que retorna [rows, fields])
    const [rows] = await connection.execute(sql);

    // 4. Retornar os dados como JSON
    res.status(200).json(rows);

  } catch (error) {
    // 5. Lidar com erros
    console.error('Erro ao buscar submissões pendentes:', error);
    // Passa o erro para seu middleware de erro (errorHandler.js)
    next(error);
  }
  
  // (Nota: Se seu 'connection()' não retorna um pool, 
  // e sim uma conexão única, você pode precisar de pool.release() aqui)
};

// src/controller/adminController.js

// ... (depois da função getSubmissoesPendentes)

// --- NOVAS ROTAS DE MODERAÇÃO ---

/**
 * POST /api/admin/submissoes/:id/aprovar
 * Aprova uma submissão, move o arquivo no Google Drive e
 * cria a entrada final em 'dg_itens_digitais'.
 */
const aprovarSubmissao = async (req, res, next) => {
  const { id: submissaoId } = req.params;
  const { id: revisorId } = req.user; // ID do bibliotecário logado

  // IDs das pastas do .env
  const approvedFolderId = process.env.GOOGLE_DRIVE_APROVADOS_ID;
  const pendingFolderId = process.env.GOOGLE_DRIVE_PENDENTES_ID;

  if (!approvedFolderId || !pendingFolderId) {
    console.error('IDs das pastas Pendentes/Aprovados não configuradas no .env');
    return next(new Error('Configuração do servidor incompleta.'));
  }

  try {
    // 1. Encontrar a submissão pendente no DB
    const sqlFind = `
      SELECT caminho_anexo, titulo_proposto, descricao 
      FROM dg_submissoes 
      WHERE submissao_id = ? AND status = 'pendente'
    `;
    const [rows] = await connection.execute(sqlFind, [submissaoId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submissão pendente não encontrada.' });
    }

    const submissao = rows[0];
    const googleFileId = submissao.caminho_anexo;

    // 2. Mover o arquivo no Google Drive
    const drive = getDriveWithOAuth();
    await drive.files.update({
      fileId: googleFileId,
      addParents: [approvedFolderId],  // Adiciona na pasta "Aprovados"
      removeParents: [pendingFolderId], // Remove da pasta "Pendentes"
      fields: 'id', // Apenas para confirmar
    });

    // 3. Atualizar o status da submissão
    const sqlUpdate = `
      UPDATE dg_submissoes 
      SET status = 'aprovado', revisado_por_id = ? 
      WHERE submissao_id = ?
    `;
    await connection.execute(sqlUpdate, [revisorId, submissaoId]);

    // 4. (Opcional, mas recomendado) Criar o item final na tabela 'dg_itens_digitais'
    const sqlInsertItem = `
      INSERT INTO dg_itens_digitais 
        (titulo, descricao, caminho_arquivo, data_publicacao, submissao_id) 
      VALUES (?, ?, ?, NOW(), ?)
    `;
    await connection.execute(sqlInsertItem, [
      submissao.titulo_proposto,
      submissao.descricao,
      googleFileId, // Salva o ID do Google no item final
      submissaoId
    ]);

    // 5. Sucesso
    res.status(200).json({ success: true, message: 'Submissão aprovada com sucesso!' });

  } catch (error) {
    console.error('Erro ao aprovar submissão:', error);
    next(error);
  }
};

/**
 * POST /api/admin/submissoes/:id/reprovar
 * Reprova uma submissão, deleta o arquivo do Google Drive e
 * atualiza o status no banco.
 */
const reprovarSubmissao = async (req, res, next) => {
  const { id: submissaoId } = req.params;
  const { id: revisorId } = req.user;

  try {
    // 1. Encontrar a submissão pendente
    const sqlFind = `
      SELECT caminho_anexo 
      FROM dg_submissoes 
      WHERE submissao_id = ? AND status = 'pendente'
    `;
    const [rows] = await connection.execute(sqlFind, [submissaoId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submissão pendente não encontrada.' });
    }

    const googleFileId = rows[0].caminho_anexo;

    // 2. Deletar o arquivo no Google Drive
    const drive = getDriveWithOAuth();
    await drive.files.delete({
      fileId: googleFileId,
    });

    // 3. Atualizar o status da submissão para 'rejeitado'
    const sqlUpdate = `
      UPDATE dg_submissoes 
      SET status = 'rejeitado', revisado_por_id = ? 
      WHERE submissao_id = ?
    `;
    await connection.execute(sqlUpdate, [revisorId, submissaoId]);

    // 4. Sucesso
    res.status(200).json({ success: true, message: 'Submissão reprovada e arquivo deletado.' });

  } catch (error) {
    console.error('Erro ao reprovar submissão:', error);
    next(error);
  }
};

// --- EXPORTAÇÕES ---
module.exports = {
    getAllSolicitacoes,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    createUsuarioDireto,
    listAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getSubmissoesPendentes,
    aprovarSubmissao,
    reprovarSubmissao
};