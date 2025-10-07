'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha no login');
      }
      
      router.push('/dashboard');

    } catch (err) {
      setError(err.message);
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
              placeholder="seu@email.com ou 12345678"
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
          
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          
          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            <BsBoxArrowInRight size={22} /> 
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className={styles.redirectLink}>
            Ainda não possui conta? <Link href="/cadastro">Clique aqui para se registrar</Link>
          </p>

        </form>
      </div>
    </>
  );
}