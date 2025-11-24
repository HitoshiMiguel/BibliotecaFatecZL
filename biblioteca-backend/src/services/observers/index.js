// src/services/observers/index.js
console.log('[OBSERVERS] require path:', __filename);

const BookSubject = require('./BookSubject');
const EmailObserver = require('./EmailObserver');
const DBObserver = require('./DBObserver');

const subject = new BookSubject();
const emailObs = new EmailObserver();
const dbObs = new DBObserver();

// anexar uma vez só (attach é idempotente graças ao Set)
subject.attach(dbObs);
subject.attach(emailObs);

module.exports = { subject, emailObs, dbObs };

console.log('[OBSERVERS] require path:', __filename);