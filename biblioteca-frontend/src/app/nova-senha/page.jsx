'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './nova-senha.module.css';

export default function NovaSenha() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (senha !== confirmar) {
      setMensagem('As senhas não conferem.');
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
      setMensagem(data?.mensagem || 'Senha atualizada com sucesso!');
    } catch (err) {
      setMensagem('Erro ao atualizar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h1 className={styles.title}>Definir Nova Senha</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
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

        <div className={styles.inputGroup}>
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

        <button className={styles.submitButton} type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      {mensagem && <p className={styles.redirectLink}>{mensagem}</p>}
    </div>
  );
}
