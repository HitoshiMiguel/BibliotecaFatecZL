'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [ui, setUi] = useState({
    status: 'idle',
    message: '',
    kind: 'error',
    fieldErrors: {}
  });

  const idRef = useRef(null);
  const passRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    if (ui.status === 'error') {
      if (ui.fieldErrors?.identifier && idRef.current) return idRef.current.focus();
      if (ui.fieldErrors?.password && passRef.current) return passRef.current.focus();
    }
  }, [ui]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUi({ status: 'loading', message: '', kind: 'error', fieldErrors: {} });

    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include',
      });

      if (response.ok) {
        setUi({ status: 'success', message: 'Login realizado com sucesso.', kind: 'success', fieldErrors: {} });
        router.push('/dashboard');
        return;
      }

      // tenta ler corpo (pode não ter)
      let data = {};
      try { data = await response.json(); } catch {}

      if (response.status === 401) {
        setUi({
          status: 'error',
          kind: 'error',
          message: 'Login ou senha inválidos.',
          fieldErrors: { identifier: '', password: '' }
        });
        return;
      }

      if (response.status === 422) {
        setUi({
          status: 'error',
          kind: 'error',
          message: data?.message || 'Revise os campos destacados.',
          fieldErrors: data?.fieldErrors || {}
        });
        return;
      }

      setUi({
        status: 'error',
        kind: 'error',
        message: data?.message || 'Serviço temporariamente indisponível. Tente novamente.',
        fieldErrors: {}
      });
    } catch {
      setUi({
        status: 'error',
        kind: 'error',
        message: 'Falha de conexão. Verifique sua internet e tente novamente.',
        fieldErrors: {}
      });
    }
  };

  return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Entrar no Sistema</h1>
      </section>

      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit} noValidate aria-describedby="form-alert">
          <Alert id="form-alert" kind={ui.kind} message={ui.message} />

          <div className={styles.inputGroup}>
            <label htmlFor="identifier">E-mail ou RA</label>
            <input
              ref={idRef}
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou 12345678"
              required
              className={`${ui.fieldErrors?.identifier ? 'input-invalid' : ''}`}
            />
            {ui.fieldErrors?.identifier && (
              <small className="field-error">{ui.fieldErrors.identifier}</small>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                ref={passRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${ui.fieldErrors?.password ? 'input-invalid' : ''}`}
              />
              <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.eyeIcon}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        style={{ outline: 'none', boxShadow: 'none', background: 'none', border: 'none' }}
                      >
                        {showPassword ? <BsEyeSlash /> : <BsEye />}
                      </button>
            </div>
            {ui.fieldErrors?.password && (
              <small className="field-error">{ui.fieldErrors.password}</small>
            )}
          </div>

          <button type="submit" className={styles.submitButton} disabled={ui.status === 'loading'}>
            <BsBoxArrowInRight size={22} />
            {ui.status === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>

          <p className={styles.redirectLink} style={{ marginTop: 12 }}>
            Esqueceu a senha? <Link href="/redefinir-senha">Redefinir senha</Link>
          </p>

          <p className={styles.redirectLink}>
            Ainda não possui conta? <Link href="/cadastro">Clique aqui para se registrar</Link>
          </p>
        </form>
      </div>
    </>
  );
}
