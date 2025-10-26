// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

/**
 * Middleware principal para verificar a autenticidade do token JWT.
 * Popula req.user com o payload do token.
 */
const isAuthenticated = (req, res, next) => {
    console.log('--- Middleware de Autenticação Ativado ---');
    
    // Certifique-se de que o cookie parser está configurado para req.cookies
    const token = req.cookies.token; 

    if (!token) {
        console.log('Middleware Falhou: Nenhum token encontrado no req.cookies.');
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: 1, perfil: 'admin', iat: ..., exp: ... }
        console.log('Middleware OK: Token verificado. Usuário ID:', decoded.id, 'Perfil:', decoded.perfil);
        next();
    } catch (error) {
        console.log('Middleware Falhou: jwt.verify lançou um erro.', error.message);
        res.status(401).json({ message: 'Token inválido.' });
    }
};

/**
 * Middleware para verificar se o usuário autenticado possui o perfil 'admin'.
 * DEVE ser usado APÓS o isAuthenticated.
 */
const isAdmin = (req, res, next) => {
    // req.user é populado pelo isAuthenticated
    if (req.user && req.user.perfil === 'admin') {
        next();
    } else {
        console.log('Tentativa de acesso negada: Não é administrador.');
        return res.status(403).json({ message: 'Acesso negado. Requer perfil de Administrador.' });
    }
};

/**
 * Middleware para verificar se o usuário é Administrador ou Bibliotecário.
 * Útil para o CRUD geral do painel.
 * DEVE ser usado APÓS o isAuthenticated.
 */
const isAdminOrBibliotecario = (req, res, next) => {
    if (req.user && (req.user.perfil === 'admin' || req.user.perfil === 'bibliotecario')) {
        next();
    } else {
        console.log('Tentativa de acesso negada: Não é Admin ou Bibliotecário.');
        return res.status(403).json({ message: 'Acesso negado. Requer perfil de Administrador ou Bibliotecário.' });
    }
};


module.exports = {
    isAuthenticated, // A função principal
    isAdmin, // Verificação de perfil
    isAdminOrBibliotecario, // Verificação de perfil combinado
};