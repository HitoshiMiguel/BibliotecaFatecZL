const { err } = require('../utils/httpError');

function required(fields = []) {
  return (req, _res, next) => {
    const missing = fields.filter((f) => {
      const v = req.body?.[f];
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    });
    if (missing.length) return next(err(400, 'VALIDATION_ERROR', `Campos obrigatórios: ${missing.join(', ')}`));
    next();
  };
}

module.exports = { required };
