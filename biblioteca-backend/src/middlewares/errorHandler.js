const FRIENDLY_BY_TYPE = {
  VALIDATION_ERROR: 'Há campos inválidos ou faltando. Revise e tente novamente.',
  DUPLICATE_EMAIL: 'Este e-mail já está em uso.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  TOKEN_EXPIRED: 'Seu link expirou. Solicite um novo.',
  RATE_LIMIT: 'Você pediu muito rápido. Aguarde alguns segundos e tente novamente.',
  UNAUTHORIZED: 'Faça login para continuar.',
  FORBIDDEN: 'Você não tem permissão para essa ação.',
  NOT_FOUND_RESOURCE: 'Recurso solicitado não foi encontrado.',
};

const FRIENDLY_BY_STATUS = {
  400: 'Dados inválidos. Revise os campos.',
  401: 'Não autorizado. Faça login.',
  403: 'Sem permissão para executar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: já existe um registro com esses dados.',
  410: 'Link ou token expirado.',
  415: 'Tipo de arquivo não permitido.',
  422: 'Os dados enviados não puderam ser processados.',
  429: 'Muitas solicitações. Tente novamente em instantes.',
  500: 'Erro interno. Tente novamente em alguns minutos.',
};

function notFound(req, res, next) {
  const err = new Error(FRIENDLY_BY_STATUS[404]);
  err.status = 404;
  err.type = 'NOT_FOUND';
  next(err);
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const type = err.type || 'DEFAULT';
  const message =
    err.message ||
    FRIENDLY_BY_TYPE[type] ||
    FRIENDLY_BY_STATUS[status] ||
    'Algo deu errado. Tente novamente.';

  console.error('[ERROR]', {
    status, type, route: req.originalUrl, method: req.method,
    head: (err.stack || '').split('\n')[0],
  });

  res.status(status).json({
    ok: false,
    error: { status, type, message },
  });
}

module.exports = { notFound, errorHandler };
