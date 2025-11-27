'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

// Hook do menu global
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';

export default function LoginPage() {
  const { setUserData } = useGlobalMenu();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);

  const [ui, setUi] = useState({
    status: 'idle',
    message: '',
    kind: 'error',
    fieldErrors: {},
  });

  const idRef = useRef(null);
  const passRef = useRef(null);

  const router = useRouter();
  
  useEffect(() => {
    document.title = 'Login - Biblioteca Fatec ZL';
  }, []);

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
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
        credentials: 'include',
      });

      let data = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        // --- 🔴 CORREÇÃO CRÍTICA AQUI ---
        // Se NÃO marcou lembrar, cria o crachá da aba.
        // Sem isso, o Provider vai achar que a aba foi fechada e vai fazer logout.
        if (!rememberMe) {
            sessionStorage.setItem('auth_tab_valid', 'true');
        } else {
            // Se marcou, remove por precaução (usa cookie persistente)
            sessionStorage.removeItem('auth_tab_valid');
        }
        // ---------------------------------

        // Atualiza Menu Global
        const userDataForMenu = { ...data, role: data.perfil };
        setUserData(userDataForMenu);

        setUi({ status: 'success', message: 'Login realizado com sucesso.', kind: 'success', fieldErrors: {} });
        
        const perfil = data.perfil;
        const currentUrl = new URL(window.location.href);
        const redirectUrl = currentUrl.searchParams.get('redirect');
        
        // Lógica de Redirecionamento
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (perfil === 'admin') {
          router.push('/admin/dashboard');
        } else if (perfil === 'bibliotecario') {
          router.push('/bibliotecario/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;

      } else { // Erros
        if (response.status === 401 || response.status === 403) {
          setUi({
            status: 'error', kind: 'error',
            message: data?.message || 'Login ou senha inválidos.',
            fieldErrors: { identifier: '', password: '' },
          });
        } else {
          setUi({
            status: 'error', kind: 'error',
            message: data?.message || 'Serviço indisponível.',
            fieldErrors: {},
          });
        }
      }
    } catch (error) {
      console.error("Erro API login:", error);
      setUi({
        status: 'error', kind: 'error',
        message: 'Falha de conexão. Verifique sua internet.',
        fieldErrors: {},
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
              ref={idRef} id="identifier" type="text" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou 12345678" required
              className={`${ui.fieldErrors?.identifier ? 'input-invalid' : ''}`}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                ref={passRef} id="password"
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className={`${ui.fieldErrors?.password ? 'input-invalid' : ''}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <BsEyeSlash /> : <BsEye />}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '-10px', marginBottom: '15px' }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--primary-color, #007bff)' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', margin: 0, fontWeight: 'normal', fontSize: '0.9rem', color: '#555' }}>
              Lembrar de mim
            </label>
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