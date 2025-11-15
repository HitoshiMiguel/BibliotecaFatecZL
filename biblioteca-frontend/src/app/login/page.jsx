// src/app/login/page.jsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

// ✅ PASSO 3 (LINHA 1): Importar o hook do menu global
// (Ajuste o caminho se o seu 'globalMenu.tsx' estiver em outro lugar)
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';

export default function LoginPage() {
  // ✅ PASSO 3 (LINHA 2): Chamar o hook para pegar a função 'setUserData'
  const { setUserData } = useGlobalMenu();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
    
    console.log('--- TESTE DE LOGIN INICIADO ---');

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include',
      });

      let data = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        
        // ✅ PASSO 3 (LINHA 3): Informar o menu global sobre o usuário
        // 1. Adaptamos o objeto 'data' (com 'perfil') para o formato 'User' (com 'role')
        const userDataForMenu = { ...data, role: data.perfil };
        // 2. Informa o menu global que o usuário está logado
        setUserData(userDataForMenu);
        // ----------------------------------------------------

        setUi({ status: 'success', message: 'Login realizado com sucesso.', kind: 'success', fieldErrors: {} });
        
        // O resto do seu código de redirecionamento já está perfeito
        const perfil = data.perfil;
        
        console.log('--- LOGIN BEM-SUCEDIDO ---');
        console.log('Perfil do usuário:', perfil);

        const currentUrl = new URL(window.location.href);
        const redirectUrl = currentUrl.searchParams.get('redirect');
        
        console.log('URL atual:', currentUrl.href);
        console.log('Parâmetro "redirect" encontrado:', redirectUrl);

        if (redirectUrl) {
          console.log('DECISÃO: Redirecionando para "redirectUrl":', redirectUrl);
          router.push(redirectUrl);
        } else if (perfil === 'admin') {
          console.log('DECISÃO: Sem redirect. Redirecionando para /admin/dashboard');
          router.push('/admin/dashboard');
        } else if (perfil === 'bibliotecario') {
          console.log('DECISÃO: Sem redirect. Redirecionando para /bibliotecario/dashboard');
          router.push('/bibliotecario/dashboard');
        } else {
          console.log('DECISÃO: Sem redirect. Redirecionando para /dashboard (perfil comum)');
          router.push('/dashboard');
        }
        
        return; // Para a execução aqui

      } else { // Tratamento de erros
        console.log('--- LOGIN FALHOU ---', response.status);
        if (response.status === 401 || response.status === 403) {
          setUi({
            status: 'error', kind: 'error',
            message: data?.message || 'Login ou senha inválidos.',
            fieldErrors: { identifier: '', password: '' },
          });
        } else { // Erro 500 ou outros
          setUi({
            status: 'error', kind: 'error',
            message: data?.message || 'Serviço indisponível.',
            fieldErrors: {},
          });
        }
      }
    } catch (error) {
      console.error("Erro na chamada da API de login:", error);
      setUi({
        status: 'error', kind: 'error',
        message: 'Falha de conexão. Verifique sua internet.',
        fieldErrors: {},
      });
    }
  };

  // --- JSX do Formulário (não precisa de alteração) ---
  return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Entrar no Sistema</h1>
      </section>

      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit} noValidate aria-describedby="form-alert">
          <Alert id="form-alert" kind={ui.kind} message={ui.message} />

          {/* Input E-mail ou RA */}
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">E-mail ou RA</label>
            <input
              ref={idRef} id="identifier" type="text" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou 12345678" required
              className={`${ui.fieldErrors?.identifier ? 'input-invalid' : ''}`}
            />
          </div>

          {/* Input Senha */}
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

          {/* Botão Submit */}
          <button type="submit" className={styles.submitButton} disabled={ui.status === 'loading'}>
            <BsBoxArrowInRight size={22} />
            {ui.status === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Links */}
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