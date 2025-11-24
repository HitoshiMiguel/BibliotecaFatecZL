// src/services/observers/BookSubject.js
class BookSubject {
  constructor() {
    console.log('[BookSubject] constructor new instance', { pid: process.pid, time: new Date().toISOString() });
    // usa Set para garantir unicidade por referência
    this.observers = new Set();
  }

  attach(observer) {
    if (!observer || typeof observer.update !== 'function') {
      console.warn('[BookSubject] attach: observer inválido', observer);
      return;
    }
    if (this.observers.has(observer)) {
      console.log('[BookSubject] observer já anexado — ignorando');
      return;
    }
    this.observers.add(observer);
    console.log('[BookSubject] observer anexado:', observer.constructor?.name || 'unknown');
  }

  detach(observer) {
    this.observers.delete(observer);
  }

  async notify(event) {
    for (const obs of Array.from(this.observers)) {
      try {
        await obs.update(event);
      } catch (err) {
        console.error('[Observer] erro em observer', err);
      }
    }
  }
}

module.exports = BookSubject;
