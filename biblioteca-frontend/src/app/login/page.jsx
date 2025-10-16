'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import { extractFriendlyMessage } from '@/services/errors'; // ajuste o path se não usa "@"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // e-mail ou RA
  const [password,   setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validação leve no cliente (opcional, melhora UX)
      if (!identifier.trim() || !password.trim()) {
        setError('Preencha e-mail/RA e senha.');
        setIsLoading(false);
        return;
      }

      // O backend espera email/senha. Mapeamos o "identifier" para 'email'.
      const body = { email: identifier.trim(), senha: password };

      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        const msg = extractFriendlyMessage(data, res.status) || 'Falha no login';
        throw new Error(msg);
      }

      router.push('/dashboard');
    } catch (e) {
      setError(e.message || 'Falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Entrar no Sistema</h1>
      </section>

      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">E-mail ou RA</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou 1234567890123"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon}>
                {showPassword ? <BsEyeSlash /> : <BsEye />}
              </span>
            </div>
          </div>

          {error && (
            <p style={{ color: 'red', textAlign: 'center', marginBottom: 15 }}>
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            <BsBoxArrowInRight size={22} />
            {isLoading ? 'Entrando...' : 'Entrar'}
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
