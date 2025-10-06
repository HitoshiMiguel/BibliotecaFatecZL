const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../model/UserModel');

// --- FUNÇÃO DE CADASTRO (AGORA COMPLETA) ---
const postCadastro = async (req, res) => {
  try {
    // 1. Pega os dados enviados pelo formulário do Next.js
    const { nome, ra, email, senha } = req.body;

    // 2. Criptografa a senha antes de salvar no banco (MUITO IMPORTANTE)
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 3. Chama a função do seu modelo para criar o usuário no banco
    await UserModel.createUser({
      nome,
      ra,
      email,
      senhaHash, // Passa a senha já criptografada
    });

    // 4. Envia uma resposta de sucesso em formato JSON
    res.status(201).json({ message: 'Usuário criado com sucesso!' });

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    
    // Verifica se o erro é de entrada duplicada (email ou RA já existem)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email ou RA já cadastrado.' });
    }
    
    // Para outros erros, envia uma resposta genérica
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

    let user = await UserModel.findByEmail(identifier);
    if (!user) {
      user = await UserModel.findByRA(identifier);
    }

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.senha_hash); 
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.usuario_id }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({ message: 'Login realizado com sucesso.' });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};


// --- FUNÇÃO PARA VERIFICAR O USUÁRIO LOGADO ---
const getCurrentUser = async (req, res) => {
  res.status(200).json({ id: req.user.id });
};


// --- FUNÇÃO DE LOGOUT ---
const logout = (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
};


// --- EXPORTAÇÕES ---
// A função 'renderCadastro' não é mais necessária para a API
module.exports = {
  postCadastro,
  login,
  getCurrentUser,
  logout,
};