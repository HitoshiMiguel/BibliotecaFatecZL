// frontend/src/services/errors.js
const BY_TYPE = {
  VALIDATION_ERROR: 'Há campos inválidos ou faltando. Revise e tente novamente.',
  DUPLICATE_EMAIL: 'Este e-mail já está em uso.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  TOKEN_EXPIRED: 'Seu link expirou. Solicite um novo.',
  RATE_LIMIT: 'Você pediu muito rápido. Aguarde alguns segundos e tente novamente.',
  UNAUTHORIZED: 'Faça login para continuar.',
  FORBIDDEN: 'Você não tem permissão para essa ação.',
  NOT_FOUND_RESOURCE: 'Recurso não encontrado.',
};

const BY_STATUS = {
  400: 'Dados inválidos. Revise os campos.',
  401: 'Não autorizado. Faça login.',
  403: 'Sem permissão.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: já existe um registro com esses dados.',
  410: 'Link/token expirado.',
  415: 'Tipo de arquivo não permitido.',
  422: 'Os dados enviados não puderam ser processados.',
  429: 'Muitas solicitações. Tente novamente em instantes.',
  500: 'Erro interno. Tente novamente em alguns minutos.',
};

export function extractFriendlyMessage(data, status) {
  if (data?.error?.message) return data.error.message;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map(e => e.msg).join('; ');
  }
  const type = data?.error?.type;
  if (type && BY_TYPE[type]) return BY_TYPE[type];
  return BY_STATUS[status] || 'Ocorreu um erro. Tente novamente.';
}
