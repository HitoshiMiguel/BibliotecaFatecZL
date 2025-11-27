// src/controller/adminController.js
console.log("🔄 RECARREGANDO ADMIN CONTROLLER... (Se você ver isso, o arquivo atualizou!)");

const bcrypt = require('bcryptjs');
const UserModel = require('../model/UserModel');
const SolicitacaoModel = require('../model/SolicitacaoModel');
const UsuarioBuilder = require('../services/UserBuilder');
const { generateUniqueToken } = require('../services/UserService');
// Ajuste de importação de pools
const { poolSistemaNovo, poolOpenBiblio } = require('../infra/db/mysql/connection');
const pool = poolSistemaNovo; // Pool principal (Novo Sistema: dg_*)
const poolLegado = poolOpenBiblio; // Pool do OpenBiblio (Legado)

const { getDriveWithOAuth } = require('../lib/googleOAuth');
const { Readable } = require('stream');

// --- CORREÇÃO DA IMPORTAÇÃO ---
const { sendConfirmationEmail, sendActivationEmail } = require('../services/emailService');
// Removido 'const { get } = require('../routes/adminRoutes');' que era um erro.
// -----------------------------


// ===============================================
// 🎯 0. FUNÇÕES DE ESTATÍSTICAS (INJETADAS)
// ===============================================

/**
 * GET /api/admin/acervo/stats
 * Busca estatísticas de Acervo Digital/Físico (para Home/Dashboard).
 */
const getAcervoStats = async (req, res) => {
    try {
        // Assume que 'dg_itens_digitais' é o digital e 'biblio' (OpenBiblio) é o físico
        const [results] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM dg_itens_digitais) AS itensDigitais,
                (SELECT COUNT(*) FROM biblio) AS livrosFisicos, 
                ((SELECT COUNT(*) FROM dg_itens_digitais) + (SELECT COUNT(*) FROM biblio)) AS totalTitulos;
        `);

        const stats = results[0] || {};
        return res.json({
            itensDigitais: stats.itensDigitais || 0,
            livrosFisicos: stats.livrosFisicos || 0,
            totalTitulos: stats.totalTitulos || 0,
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas de acervo:", error);
        res.status(500).json({ message: "Erro interno ao buscar estatísticas de acervo." });
    }
};

/**
 * GET /api/admin/stats/usuarios
 * Busca estatísticas de usuários (Ativos, Pendentes, Inativos, Bloqueados).
 */
const getStatsUsuarios = async (req, res) => {
    try {
        const [results] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN status_conta = 'ativa' THEN 1 ELSE 0 END) AS ativos,
                SUM(CASE WHEN status_conta = 'pendente' THEN 1 ELSE 0 END) AS pendentes,
                SUM(CASE WHEN status_conta = 'inativa' THEN 1 ELSE 0 END) AS inativos,
                
                -- >> CORREÇÃO: Busca o valor 'bloqueado' dentro do ENUM status_conta
                SUM(CASE WHEN status_conta = 'bloqueado' THEN 1 ELSE 0 END) AS bloqueados,
                
                COUNT(*) AS total
            FROM dg_usuarios;
        `);

        return res.json(results[0] || { total: 0, ativos: 0, pendentes: 0, inativos: 0, bloqueados: 0 });
    } catch (error) {
        console.error("Erro ao buscar estatísticas de usuários:", error);
        res.status(200).json({ 
            message: "Erro no DB, estatísticas de usuários zeradas.",
            total: 0, ativos: 0, pendentes: 0, inativos: 0, bloqueados: 0 
        });
    }
};

/**
 * GET /api/admin/stats/reservas
 * Busca estatísticas de Reservas (ativa, pendente, concluida, cancelada/expirada).
 * Nota: Assume a tabela 'reserve' do poolOpenBiblio (Legado).
 */
const getStatsReservas = async (req, res) => {
    try {
        // Assume que os status na tabela dg_reservas são: 'ativa', 'pendente', 'concluida', 'cancelada', 'expirada'
        const [results] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) AS ativas,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendentes,
                SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas,
                SUM(CASE WHEN status = 'cancelada' OR status = 'expirada' THEN 1 ELSE 0 END) AS canceladas,
                COUNT(*) AS total
            FROM dg_reservas;
        `);
        
        // Retorna os dados do DB (ou zero se a tabela estiver vazia)
        return res.json(results[0] || { total: 0, ativas: 0, pendentes: 0, concluidas: 0, canceladas: 0 });

    } catch (error) {
        console.error("Erro ao buscar estatísticas de reservas (tabela 'dg_reservas'):", error);
        // Retorna 200 com zeros em caso de erro (para não quebrar o frontend)
        res.status(200).json({ 
            message: "Erro no DB, estatísticas de reservas zeradas. (Verifique se a tabela 'dg_reservas' existe).",
            total: 0, ativas: 0, pendentes: 0, concluidas: 0, canceladas: 0 
        });
    }
};


// ===============================================
// 1. FUNÇÕES PARA VISUALIZAR SOLICITAÇÕES
// ===============================================

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

// ===============================================
// 2. FUNÇÃO PARA APROVAÇÃO (CRIAÇÃO VIA BUILDER E CONFIRMAÇÃO)
// ===============================================

/**
 * Aprova uma solicitação (Professor), cria o usuário com senha ORIGINAL e envia email de CONFIRMAÇÃO.
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
             return res.status(409).json({ message: `Email (${solicitacao.email}) já cadastrado na base de usuários principal.` });
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
        await SolicitacaoModel.updateStatus(id, 'aprovado'); // Usa o id aqui 

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

// ===============================================
// 3. GESTÃO DE USUÁRIOS (CRUD)
// ===============================================

const listAllUsers = async (req, res) => {
    console.log("-> listAllUsers acionado"); // Log de entrada
    try {
        const users = await UserModel.getAllUsers();
        // Remove senha_hash e tokens por segurança antes de enviar (getAllUsers já faz isso)
        res.status(200).json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ message: 'Erro interno ao buscar usuários.' });
    }
};

/**
 * Obtém detalhes de um usuário específico pelo ID (Read One).
 */
const getUserById = async (req, res) => {
    const { id } = req.params;
    console.log(`-> getUserById acionado para ID: ${id}`); // Log de entrada
    try {
        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        // Remove dados sensíveis antes de enviar
        delete user.senha_hash;
        delete user.token_ativacao;
        delete user.reset_token;
        delete user.reset_token_expira;
        res.status(200).json(user);
    } catch (error) {
        console.error(`Erro ao buscar Usuário ${id}:`, error);
        res.status(500).json({ message: 'Erro interno ao buscar detalhes do Usuário.' });
    }
};

/**
 * Atualiza os dados de um usuário (Update).
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
        // Busca o usuário atual para verificações
        const currentUser = await UserModel.findById(id);
        if (!currentUser) {
            return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
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
                return res.status(400).json({ message: 'O campo RA é obrigatório para Usuários do tipo Comum (Aluno).' });
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

        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });

    } catch (error) {
        console.error(`Erro ao atualizar usuário ${id}:`, error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Erro: Email ou RA já está em uso por outro usuário.' });
         }
        res.status(500).json({ message: 'Erro interno ao atualizar usuário.' });
    }
}

/**
 * Exclui um usuário (Delete).
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
        // 1. Busca o usuário para obter o email ANTES de excluir
        const userToDelete = await UserModel.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
        }
        userEmail = userToDelete.email; // Guarda o email

        // 2. Exclui o usuário principal da tabela dg_usuarios
        const affectedRowsUser = await UserModel.deleteUserById(id);

        if (affectedRowsUser === 0) {
            // Isso não deveria acontecer se a busca acima funcionou
             console.log(`deleteUser: Nenhuma linha excluída em dg_usuarios para ID: ${id}. Inesperado.`);
             // Ainda assim, tenta limpar a solicitação por segurança
        } else {
             console.log(`deleteUser: Usuário ID ${id} excluído de dg_usuarios.`);
        }

        // --- NOVA ETAPA: Excluir solicitação correspondente ---
        if (userEmail) {
            console.log(`deleteUser: Tentando excluir solicitação associada ao email: ${userEmail}`);
            await SolicitacaoModel.deleteSolicitacaoByEmail(userEmail);
            // Não verificamos o resultado aqui, pois a solicitação pode não existir (ex: Aluno)
        }
        // ---------------------------------------------------

        res.status(200).json({ message: 'usuário e solicitações associadas (se existirem) excluídos com sucesso.' });

    } catch (error) {
        console.error(`Erro ao excluir usuário ${id} ou solicitação associada:`, error);
        // Tratar erros de chave estrangeira (se aplicável, embora a exclusão da solicitação deva ocorrer após)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Não é possível excluir este usuário pois ele possui registos associados (ex: submissões).' });
        }
        res.status(500).json({ message: 'Erro interno ao excluir usuárior.' });
    }
};

// ===============================================
// 4. CRIAÇÃO DIRETA (ADMINISTRATIVA)
// ===============================================

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
                message: `Usuário Professor criado. E-mail de ativação enviado para ${email}.`,
                usuario: novoUsuario.email
            });
        }
        // --------------------------------------------

        // Resposta para outros perfis (Aluno, Admin, Biblio)
        return res.status(201).json({
            message: `Usuário ${perfil} criado com sucesso.`,
            usuario: novoUsuario.email
        });

    } catch (error) {
         console.error("Erro CRÍTICO na criação direta de usuário:", error);
         if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
             return res.status(409).json({ message: 'Email ou RA já cadastrado (erro DB).' });
         }
         // Captura erros do Builder (ex: RA em falta, token em falta)
         if (error.message && (error.message.includes('obrigatório') || error.message.includes('Token') || error.message.includes('Senha'))) {
             return res.status(400).json({ message: error.message });
         }
        return res.status(500).json({ message: 'Erro interno no servidor ao criar usuário.' });
    }
};

// ===============================================
// 5. GESTÃO DE SUBMISSÕES E PUBLICAÇÕES
// ===============================================


// GET /api/admin/submissoes/pendentes
const getSubmissoesPendentes = async (req, res, next) => {
  try {
    // 1. Definir a query SQL
    const sql = `
      SELECT
        s.submissao_id,
        s.titulo_proposto,
        s.descricao,
        s.data_submissao,
        u.nome AS nome_remetente,
        s.autor,
        s.editora,
        s.ano_publicacao,
        s.conferencia,
        s.periodico,
        s.instituicao,
        s.orientador,
        s.curso,
        s.ano_defesa,
        s.tipo
      FROM
        dg_submissoes s
      JOIN
        dg_usuarios u ON s.usuario_id = u.usuario_id
      WHERE
        s.status = 'pendente'
      ORDER BY
        s.data_submissao ASC;
    `;

    // 2. Executar a query
    const [rows] = await pool.execute(sql);
    // 3. Retornar os dados como JSON
    res.status(200).json(rows);

  } catch (error) {
    // 4. Lidar com erros
    console.error('Erro ao buscar submissões pendentes:', error);
    next(error);
  }
}; // <-- FIM DA FUNÇÃO getSubmissoesPendentes

/**
 * PUT /api/admin/submissoes/:id
 * Atualiza os detalhes de uma submissão ANTES de ser aprovada.
 */
const updateSubmissao = async (req, res, next) => {
  const idParam = String(req.params.id).trim();
  
  console.log(`\n📢 [DEBUG] Tentando atualizar ID: "${idParam}"`);
  console.log("📦 [DEBUG] Dados recebidos:", req.body);

  // Mapeamento de campos (Frontend -> Backend)
  const titulo = req.body.titulo_proposto || req.body.titulo;
  const ano = req.body.ano_publicacao || req.body.ano;
  const { autor, editora, descricao } = req.body;

  // CASO 1: É LIVRO FÍSICO (LEGADO)?
  if (idParam.startsWith('LEGACY_')) {
      console.log("📚 [DEBUG] Detectado item LEGADO. Atualizando OpenBiblio...");
      const legacyId = idParam.split('_')[1]; // Remove o prefixo LEGACY_

      try {
          // Atualiza Tabela Principal (biblio)
          const sqlBiblio = `UPDATE biblio SET title = ?, author = ? WHERE bibid = ?`;
          await poolLegado.execute(sqlBiblio, [titulo, autor, legacyId]);
          
          console.log("✅ [DEBUG] Legado atualizado (Título/Autor).");
          return res.status(200).json({ success: true, message: 'Item físico atualizado.' });
      } catch (err) {
          console.error("❌ [DEBUG] Erro no Legado:", err);
          return next(err);
      }
  }

  // CASO 2: É ITEM DIGITAL (SISTEMA NOVO)
  try {
    const sqlFind = "SELECT submissao_id FROM dg_submissoes WHERE submissao_id = ?";
    const [rows] = await pool.execute(sqlFind, [idParam]);

    if (rows.length === 0) {
      console.log("❌ [DEBUG] ID não encontrado no banco novo.");
      return res.status(404).json({ message: 'Submissão não encontrada.' });
    }

    const sqlUpdate = `
      UPDATE dg_submissoes SET
        titulo_proposto = ?, descricao = ?, autor = ?, editora = ?,
        ano_publicacao = ?, conferencia = ?, periodico = ?, instituicao = ?,
        orientador = ?, curso = ?, ano_defesa = ?, tipo = ?
      WHERE submissao_id = ?
    `;
    
    const values = [
      titulo || null, descricao || null, autor || null, editora || null,
      ano || null, req.body.conferencia || null, req.body.periodico || null, 
      req.body.instituicao || null, req.body.orientador || null, 
      req.body.curso || null, req.body.ano_defesa || null, req.body.tipo || null,
      idParam
    ];

    const [result] = await pool.execute(sqlUpdate, values);
    console.log("✅ [DEBUG] Update Digital OK. Linhas afetadas:", result.affectedRows);

    if (result.affectedRows === 0) {
        // Se 0, pode ser que os dados eram iguais. Não é erro, mas avisamos.
        return res.status(200).json({ success: true, message: 'Dados salvos (sem alterações detectadas).' });
    }

    res.status(200).json({ success: true, message: 'Submissão atualizada com sucesso.' });

  } catch (error) {
    console.error('❌ [DEBUG] Erro Fatal ao atualizar:', error);
    next(error);
  }
};


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
      SELECT * FROM dg_submissoes 
      WHERE submissao_id = ? AND status = 'pendente'
    `;
    const [rows] = await pool.execute(sqlFind, [submissaoId]);
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
    await pool.execute(sqlUpdate, [revisorId, submissaoId]);

    // 4. Criar o item final na tabela 'dg_itens_digitais'
    const sqlInsertItem = `
      INSERT INTO dg_itens_digitais 
        (titulo, autor, ano, descricao, caminho_arquivo, data_publicacao, submissao_id) 
      VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `;
    await pool.execute(sqlInsertItem, [      
      submissao.titulo_proposto,
      submissao.autor,
      submissao.ano_publicacao || submissao.ano_defesa, // Pega o ano que estiver preenchido
      submissao.descricao,
      googleFileId,
      submissaoId
    ]);

    // 5. Sucesso
    res.status(200).json({ success: true, message: 'Submissão aprovada com sucesso!' });

  } catch (error) {
    console.error('Erro ao aprovar submissão:', error);
    next(error);
  }
}; // <-- FIM DA FUNÇÃO aprovarSubmissao

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
    const [rows] = await pool.execute(sqlFind, [submissaoId]);
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
    await pool.execute(sqlUpdate, [revisorId, submissaoId]);
    // 4. Sucesso
    res.status(200).json({ success: true, message: 'Submissão reprovada e arquivo deletado.' });

  } catch (error) {
    console.error('Erro ao reprovar submissão:', error);
    next(error);
  }
}; // <-- FIM DA FUNÇÃO reprovarSubmissao

/**
 * DELETE (via POST) /api/admin/submissoes/:id/deletar-aprovada
 * Deleta um item do Acervo (e do Drive) que foi APROVADO previamente.
 */
const deletarPublicacaoAprovada = async (req, res, next) => {
  const { id: submissaoId } = req.params;

  try {
    // 1. Pega o anexo para deletar do Drive
    const sqlFind = `SELECT caminho_anexo FROM dg_submissoes WHERE submissao_id = ? AND status = 'aprovado'`;
    const [rows] = await pool.execute(sqlFind, [submissaoId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Publicação aprovada não encontrada.' });

    const googleFileId = rows[0].caminho_anexo;

    if (googleFileId) {
      const drive = getDriveWithOAuth();
      // Tenta deletar. Usa catch para ignorar se o arquivo já foi apagado manualmente no Drive.
      await drive.files.delete({ fileId: googleFileId }).catch(err => console.log("Arquivo já inexistente no Drive, ignorando...", err.message));
    }

    // --- 🔴 FIX: LIMPEZA DE FAVORITOS (NOVO) ---
    // Primeiro, descobrimos qual é o ID do item na tabela dg_itens_digitais
    const [itens] = await pool.execute("SELECT item_id FROM dg_itens_digitais WHERE submissao_id = ?", [submissaoId]);
    
    if (itens.length > 0) {
        const itemId = itens[0].item_id;
        // Agora apagamos todos os favoritos ligados a esse item
        await pool.execute("DELETE FROM dg_favoritos WHERE item_id = ?", [itemId]);
    }
    // -------------------------------------------

    // 2. Remove o item final da tabela de itens digitais
    await pool.execute("DELETE FROM dg_itens_digitais WHERE submissao_id = ?", [submissaoId]);

    // 3. Remove a submissão aprovada
    await pool.execute("DELETE FROM dg_submissoes WHERE submissao_id = ?", [submissaoId]);

    return res.status(200).json({
      success: true,
      message: 'Publicação aprovada, arquivo e favoritos associados foram excluídos com sucesso.',
    });

  } catch (error) {
    console.error('Erro ao deletar publicação aprovada:', error);
    next(error);
  }
};

/**
 * POST /api/admin/publicar-direto
 * Publicação Direta (upload e inserção no Acervo, sem passar por 'pendente').
 */
const publicarDireto = async (req, res, next) => {
  try {
    // 1. VERIFICAÇÕES (Arquivo e Usuário)
    // -------------------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Sessão inválida.' });
    }

    // 2. LÓGICA DO GOOGLE DRIVE 
    // -------------------------------------------------------------------
    const { tipo, status, data_publicacao, ...meta } = req.body; 
    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;
    const usuarioId = req.user.id; // ID do Admin que está publicando

    const drive = getDriveWithOAuth();
    const stream = Readable.from(buffer);

    // Usando a variável de ambiente dos APROVADOS
    const aprovadosId = process.env.GOOGLE_DRIVE_APROVADOS_ID; 
    if (!aprovadosId) {
      throw new Error('ID da pasta "Aprovados" não configurado no .env');
    }

    const { data: file } = await drive.files.create({
      requestBody: { name: filename, parents: [aprovadosId] }, 
      media: { mimeType, body: stream },
      fields: 'id, name',
    });

    const googleFileId = file.id;

    // 3. LÓGICA DO BANCO DE DADOS (COM O STATUS E DATA)
    // -------------------------------------------------------------------
    
    let statusFinal = 'publicado';
    let dataFinal; // Variável para a data final formatada (YYYY-MM-DD HH:MM:SS)

    // Se o front mandou 'agendado' e tem uma data válida
    if (status === 'agendado' && data_publicacao) {
        statusFinal = 'agendado';

        let dataString = String(data_publicacao);

        if (dataString.includes('.')) {
            dataString = dataString.split('.')[0]; 
        }

        dataString = dataString.replace('T', ' ').replace('Z', '');
        
        // 4. Adiciona segundos se faltar (para ficar HH:MM:00)
        if (dataString.length === 16) {
            dataString += ':00';
        }

        dataFinal = dataString.trim(); // Data agendada formatada
    } else {
        // Se for publicar agora, usa a data atual localmente
        const agora = new Date();
        const offset = agora.getTimezoneOffset() * 60000;
        const dataLocal = new Date(agora.getTime() - offset).toISOString();
        dataFinal = dataLocal.slice(0, 19).replace('T', ' ');
    }
    
    // Pega os metadados do form do admin
    const {
      titulo_proposto,
      descricao,
      autor,
      editora,
      ano_publicacao,
      conferencia,
      periodico,
      instituicao,
      orientador,
      curso,
      ano_defesa
    } = meta;

    // --- PASSO 3.1: INSERIR NA TABELA DE SUBMISSÕES (CORRIGIDO) ---
    // Cria um registro 'aprovado' para fins de histórico e moderação.
    const sqlSubmissao = `
      INSERT INTO dg_submissoes (
        usuario_id, titulo_proposto, descricao, caminho_anexo, 
        status, data_submissao, revisado_por_id, 
        autor, editora, ano_publicacao, conferencia, 
        periodico, instituicao, orientador, curso, ano_defesa, tipo
      ) VALUES (?, ?, ?, ?, 'aprovado', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const valuesSubmissao = [
      usuarioId, titulo_proposto || null, descricao || null, googleFileId,
      usuarioId, // revisado_por_id
      autor || null, editora || null, ano_publicacao || null, conferencia || null,
      periodico || null, instituicao || null, orientador || null, curso || null, ano_defesa || null, tipo || null
    ];

    const [resultSubmissao] = await pool.execute(sqlSubmissao, valuesSubmissao);
    const submissaoId = resultSubmissao.insertId;

    // --- PASSO 3.2: INSERIR NA TABELA DE ITENS DIGITAIS ---
    const sqlItem = `
        INSERT INTO dg_itens_digitais (
            titulo, autor, ano, descricao, 
            caminho_arquivo, data_publicacao, submissao_id, 
            status, tipo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const anoParaItem = ano_publicacao || new Date().getFullYear();

    // dataFinal já está como string formatada para MySQL (YYYY-MM-DD HH:MM:SS)
    const dataParaMySQL = dataFinal;

    const valuesItem = [
        titulo_proposto, 
        autor, 
        anoParaItem,
        descricao,
        googleFileId,
        dataParaMySQL, // Salva a data agendada ou a data atual
        submissaoId,   
        statusFinal,   
        tipo
    ];

    await pool.execute(sqlItem, valuesItem);

    // 4. SUCESSO
    // -------------------------------------------------------------------
    const novaPublicacao = {
      id: submissaoId,
      googleFileId,
      status: statusFinal,
      data_publicacao: dataParaMySQL,
      ...meta
    };
    
    res.status(201).json(novaPublicacao);

  } catch (err) {
    // 5. ERRO
    // -------------------------------------------------------------------
    console.error('Erro na publicação direta:', err);
    // Passa o erro para seu 'errorHandler' global
    next(err); 
  }
};


// ==========================================================
// --- NOVO MÉTODO PARA BUSCAR O LINK DO ARQUIVO ---
// ==========================================================
const getSubmissionFileLink = async (req, res, next) => {
  try {
    const { id: submissaoId } = req.params;

    // 1. Encontrar a submissão no seu banco de dados
    const sqlFind = "SELECT caminho_anexo FROM dg_submissoes WHERE submissao_id = ?";
    const [rows] = await pool.execute(sqlFind, [submissaoId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submissão não encontrada.' });
    }

    const googleFileId = rows[0].caminho_anexo;
    if (!googleFileId) {
      return res.status(404).json({ message: 'Submissão não possui arquivo anexado.' });
    }

    // 2. Pedir ao Google Drive os metadados do arquivo
    const drive = getDriveWithOAuth();
    const fileMeta = await drive.files.get({
      fileId: googleFileId,
      // Pedimos o link de visualização e o link de conteúdo (download/iframe)
      fields: 'webViewLink, webContentLink, name', 
    });

    // 3. Enviar os links para o frontend
    res.status(200).json(fileMeta.data);

  } catch (error) {
    console.error('Erro ao buscar link do arquivo:', error);
    next(error);
  }
};


// ==========================================================
// --- EXPORTAÇÕES FINAIS ---
// ==========================================================
module.exports = {
    // Estatísticas
    getAcervoStats,
    getStatsUsuarios,
    getStatsReservas, 

    // Solicitações
    getAllSolicitacoes,
    aprovarSolicitacao,
    rejeitarSolicitacao,

    // Usuários CRUD/Criação Direta
    createUsuarioDireto,
    listAllUsers,
    getUserById,
    updateUser,
    deleteUser,

    // Submissões/Publicação
    getSubmissoesPendentes,
    aprovarSubmissao,
    reprovarSubmissao,
    updateSubmissao,
    deletarPublicacaoAprovada,
    publicarDireto,
    getSubmissionFileLink, 
};