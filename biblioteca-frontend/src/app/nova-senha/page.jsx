'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import styles from './nova-senha.module.css'; // se não tiver, pode remover esta linha

export default function NovaSenha() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire({ icon: 'error', title: 'Link inválido', text: 'Token ausente ou expirado.' });
      return;
    }
    if (senha !== confirmar) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'As senhas não conferem.' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/nova-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Senha redefinida!',
          text: 'Você já pode fazer login com a nova senha.',
          showConfirmButton: false,
          timer: 1600,
          timerProgressBar: true,
        });
        router.push('/login'); // ajuste se sua rota de login for outra
      } else {
        Swal.fire({ icon: 'error', title: 'Ops…', text: data?.mensagem || 'Não foi possível redefinir.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao conectar ao servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles?.formWrapper ?? ''} style={!styles ? { maxWidth: 420, margin: 'auto', padding: 24 } : undefined}>
      <h1 className={styles?.title ?? ''}>Definir Nova Senha</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles?.inputGroup ?? ''}>
          <label htmlFor="senha">Nova senha</label>
          <input
            id="senha"
            type="password"
            placeholder="Digite a nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <div className={styles?.inputGroup ?? ''}>
          <label htmlFor="confirmar">Confirmar senha</label>
          <input
            id="confirmar"
            type="password"
            placeholder="Confirme sua senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
        </div>

        <button className={styles?.submitButton ?? ''} type="submit" disabled={loading} style={!styles ? { width: '100%', padding: 10 } : undefined}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}

