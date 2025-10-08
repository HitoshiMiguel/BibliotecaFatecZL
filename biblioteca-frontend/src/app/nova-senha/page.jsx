'use client';
import React, { useState, useEffect } from 'react';

export default function NovaSenha() {
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [token, setToken] = useState('');

  // Captura o token da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/api/nova-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    });
    const data = await res.json();
    setMensagem(data.mensagem);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 32 }}>
      <h2>Defina sua nova senha</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 12, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 8 }}>
          Redefinir senha
        </button>
      </form>
      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}