'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cadastro.module.css';
import Link from 'next/link';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [ra, setRa] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [ui, setUi] = useState({ status: 'idle', message: '', kind: 'error' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const nomeRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    if (Object.keys(errors).length) {
      if (errors.nome && nomeRef.current) return nomeRef.current.focus();
      if (errors.email && emailRef.current) return emailRef.current.focus();
    }
  }, [errors]);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setUi({ status: 'idle', message: '', kind: 'error' });
    setErrors({});

    if (senha !== confirmarSenha) {
      setErrors({ confirmarSenha: 'As senhas não coincidem.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, ra, senha, confirmarSenha }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setUi({ status: 'success', message: 'Conta criada! Verifique seu e-mail para confirmar.', kind: 'success' });
        router.push('/login');
        return;
      }

      // 422 pode vir em formatos diferentes; normaliza
      if (response.status === 422) {
        const newErrors = {};

        if (Array.isArray(data?.errors)) {
          data.errors.forEach((err) => {
            if (err?.path) newErrors[err.path] = err.msg || 'Campo inválido';
          });
        }
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          Object.assign(newErrors, data.fieldErrors);
        }

        setUi({ status: 'error', message: data?.message || 'Revise os campos destacados.', kind: 'error' });
        setErrors(newErrors);
        return;
      }

      // outros erros
      throw new Error(data?.message || 'Erro ao realizar o cadastro.');
    } catch (err) {
      setUi({ status: 'error', message: err.message, kind: 'error' });
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
        <form onSubmit={handleSubmit} noValidate aria-describedby="form-alert">
          <Alert id="form-alert" kind={ui.kind} message={ui.message} />

          <div className={styles.field}>
            <label htmlFor="nome">Nome *</label>
            <input
              ref={nomeRef}
              type="text"
              id="nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className={errors.nome ? 'input-invalid' : ''}
            />
            {errors.nome && <small className="field-error">{errors.nome}</small>}
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
              className={errors.ra ? 'input-invalid' : ''}
            />
            {errors.ra && <small className="field-error">{errors.ra}</small>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-mail *</label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={errors.email ? 'input-invalid' : ''}
            />
            {errors.email && <small className="field-error">{errors.email}</small>}
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
              className={errors.senha ? 'input-invalid' : ''}
            />
            {errors.senha && <small className="field-error">{errors.senha}</small>}
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
              className={errors.confirmarSenha ? 'input-invalid' : ''}
            />
            {errors.confirmarSenha && <small className="field-error">{errors.confirmarSenha}</small>}
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
