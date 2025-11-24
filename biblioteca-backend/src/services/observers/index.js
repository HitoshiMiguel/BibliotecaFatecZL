console.log('[OBSERVERS] require path:', __filename);

const BookSubject = require('./BookSubject');
const EmailObserver = require('./EmailObserver');
const DBObserver = require('./DBObserver');

if (!global.__BOOK_SUBJECT_SINGLETON) {
  const subject = new BookSubject();
  const emailObs = new EmailObserver();
  const dbObs = new DBObserver();

  subject.attach(dbObs);
  subject.attach(emailObs);

  global.__BOOK_SUBJECT_SINGLETON = { subject, emailObs, dbObs };
}

module.exports = global.__BOOK_SUBJECT_SINGLETON;

console.log('[OBSERVERS] singleton criado/exportado');
