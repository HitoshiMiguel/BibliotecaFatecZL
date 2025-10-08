'use client';

import { useState } from 'react';
import styles from './redefinir-senha.module.css';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMensagem(data?.mensagem || 'Verifique seu e-mail!');
    } catch (err) {
      setMensagem('Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h1 className={styles.title}>Redefinir Senha</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className={styles.submitButton} type="submit">
          Enviar link de redefinição
        </button>
      </form>

      {mensagem && <p className={styles.redirectLink}>{mensagem}</p>}
    </div>
  );
}
