const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('--- Middleware de Autenticação Ativado ---');
  console.log('Objeto de Cookies recebido:', req.cookies); // Mostra todos os cookies

  const token = req.cookies.token;

  if (!token) {
    console.log('Middleware Falhou: Nenhum token encontrado no req.cookies.');
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  console.log('Token encontrado:', token.substring(0, 15) + '...'); // Mostra o início do token

  try {
    console.log('Verificando token com a chave:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('Middleware OK: Token verificado com sucesso. Usuário ID:', decoded.id);
    next();
  } catch (error) {
    console.log('Middleware Falhou: jwt.verify lançou um erro.', error.message);
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;