'use client';

import React, { useState, useEffect } from 'react';
import styles from './redefinir-senha.module.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [banner, setBanner] = useState({ kind: 'info', message: '' });

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Campo vazio', text: 'Por favor, insira seu e-mail.' });
      return;
    }

    try {
      setLoading(true);
      setBanner({ kind: 'info', message: '' });

      const res = await fetch('http://localhost:4000/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'E-mail enviado!',
          text: 'Se o e-mail existir, você receberá o link de redefinição em instantes.',
          confirmButtonColor: '#b71c1c',
          confirmButtonText: 'OK',
        });
        setBanner({ kind: 'info', message: 'Se o e-mail existir, enviaremos um link de recuperação.' });
        setCooldown(30);
      } else if (res.status === 422) {
        setBanner({ kind: 'error', message: data?.message || 'Revise o e-mail informado.' });
      } else {
        setBanner({ kind: 'error', message: data?.mensagem || data?.message || 'Erro ao enviar o e-mail.' });
      }
    } catch {
      setBanner({ kind: 'error', message: 'Falha ao conectar ao servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h1 className={styles.title}>Redefinir Senha</h1>

      <form onSubmit={handleSubmit} noValidate aria-describedby="form-alert">
        <Alert id="form-alert" kind={banner.kind} message={banner.message} />

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
          style={{ opacity: loading || cooldown > 0 ? 0.7 : 1, cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Enviar link de redefinição'}
        </button>
      </form>

      <p className={styles.redirectLink}>Se o e-mail existir, enviaremos o link de redefinição.</p>
    </div>
  );
}
