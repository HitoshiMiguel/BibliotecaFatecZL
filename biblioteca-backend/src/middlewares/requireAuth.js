// src/middlewares/requireAuth.js
const { err } = require('../utils/httpError');

// adapte ao seu mecanismo real: session, JWT no cookie, etc.
module.exports = function requireAuth(req, _res, next) {
  const userId = req.session?.userId || req.user?.id || null;
  if (!userId) return next(err(401, 'UNAUTHORIZED', 'Faça login para continuar.'));
  next();
};
