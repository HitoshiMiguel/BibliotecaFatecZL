'use client';

import React, { useState, useEffect } from 'react';
import styles from './redefinir-senha.module.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // segundos restantes para reenviar

  // Efeito para diminuir o contador automaticamente
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vazio',
        text: 'Por favor, insira seu e-mail.',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'E-mail enviado!',
          text: 'Se o e-mail existir, você receberá o link de redefinição em instantes.',
          confirmButtonColor: '#b71c1c',
          confirmButtonText: 'OK',
        });
        setCooldown(30); // ativa o timer de 30s
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Ops...',
          text: data?.mensagem || 'Erro ao enviar o e-mail.',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Falha ao conectar ao servidor.',
      });
    } finally {
      setLoading(false);
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
            disabled={loading || cooldown > 0}
          />
        </div>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={loading || cooldown > 0}
          style={{
            opacity: loading || cooldown > 0 ? 0.7 : 1,
            cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? 'Enviando...'
            : cooldown > 0
            ? `Reenviar em ${cooldown}s`
            : 'Enviar link de redefinição'}
        </button>
      </form>

      <p className={styles.redirectLink}>
        Se o e-mail existir, enviaremos o link de redefinição.
      </p>
    </div>
  );
}
