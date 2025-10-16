'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cadastro.module.css';
import Link from 'next/link';

// Se você criou "src/services/errors.js" no front com a função extractFriendlyMessage:
import { extractFriendlyMessage } from '@/services/errors';
// Se não usa alias "@", troque a importação acima por:
// import { extractFriendlyMessage } from '../../services/errors';

export default function CadastroPage() {
  // Estados de formulário
  const [nome, setNome] = useState('');
  const [ra, setRa] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de UI
  const [errors, setErrors] = useState({});   // { global, nome, email, ra, senha, confirmarSenha }
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validação rápida no cliente
    if (senha !== confirmarSenha) {
      setErrors(prev => ({ ...prev, confirmarSenha: 'As senhas não coincidem.' }));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, ra, senha, confirmarSenha }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        const msg = extractFriendlyMessage(data, res.status);

        // Tenta mapear a mensagem para campos específicos
        const fieldErr = {};
        if (/nome/i.test(msg)) fieldErr.nome = 'Verifique o nome informado.';
        if (/email|e-mail/i.test(msg)) fieldErr.email = 'Verifique o e-mail informado.';
        if (/ra/i.test(msg)) fieldErr.ra = 'Verifique o RA informado.';
        if (/senha/i.test(msg)) fieldErr.senha = 'Verifique a senha informada.';
        if (/confirm/i.test(msg) || /coincid/i.test(msg)) fieldErr.confirmarSenha = 'As senhas não coincidem.';

        if (Object.keys(fieldErr).length) {
          setErrors(prev => ({ ...prev, ...fieldErr, global: undefined }));
        } else {
          setErrors(prev => ({ ...prev, global: msg || 'Erro ao realizar o cadastro.' }));
        }
        return;
      }

      alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
      router.push('/login');

    } catch (e2) {
      setErrors(prev => ({ ...prev, global: e2.message || 'Falha inesperada no cadastro.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Crie seu cadastro</h1>
      </section>

      <main className={styles.formContainer}>
        <form onSubmit={handleSubmit} noValidate>
          {errors.global && <p className={styles.errorGlobal}>{errors.global}</p>}

          <div className={styles.field}>
            <label htmlFor="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            {errors.nome && <small className={styles.errorField}>{errors.nome}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="ra">RA *</label>
            <input
              type="text"
              id="ra"
              name="ra"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              required
              minLength={13}
              maxLength={13}
            />
            {errors.ra && <small className={styles.errorField}>{errors.ra}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-mail *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <small className={styles.errorField}>{errors.email}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="senha">Senha *</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={8}
            />
            {errors.senha && <small className={styles.errorField}>{errors.senha}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmarSenha">Confirmar Senha *</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
            {errors.confirmarSenha && <small className={styles.errorField}>{errors.confirmarSenha}</small>}
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar-se'}
          </button>

          <p className={styles.redirectLink}>
            Já possui uma conta? <Link href="/login">Clique aqui para entrar!</Link>
          </p>
        </form>
      </main>
    </>
  );
}
