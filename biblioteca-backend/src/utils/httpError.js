class HttpError extends Error {
  constructor(status = 500, type = 'DEFAULT', message = 'Algo deu errado.') {
    super(message);
    this.status = status;
    this.type = type;
  }
}
const err = (status, type, message) => new HttpError(status, type, message);
module.exports = { HttpError, err };
