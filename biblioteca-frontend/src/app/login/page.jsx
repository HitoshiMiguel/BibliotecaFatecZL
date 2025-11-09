// src/app/login/page.jsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css'; // Mantenha a sua importação de CSS Modules
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

// REMOVIDO: export const metadata = { ... }

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
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
    // --- Definir o título da página dinamicamente ---
    useEffect(() => {
        document.title = 'Login - Biblioteca Fatec ZL'; // Define o título da aba do navegador
    }, []); // Executa apenas uma vez quando o componente monta
    // ---------------------------------------------

    useEffect(() => {
        // Lógica de foco em erro (mantida)
        if (ui.status === 'error') {
            if (ui.fieldErrors?.identifier && idRef.current) return idRef.current.focus();
            if (ui.fieldErrors?.password && passRef.current) return passRef.current.focus();
        }
    }, [ui]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUi({ status: 'loading', message: '', kind: 'error', fieldErrors: {} });
        
        console.log('--- TESTE DE LOGIN INICIADO ---'); // LOG 1

        try {
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
                credentials: 'include',
            });

            let data = {};
            try { data = await response.json(); } catch {}

            if (response.ok) {
                setUi({ status: 'success', message: 'Login realizado com sucesso.', kind: 'success', fieldErrors: {} });
                const perfil = data.perfil;
                
                console.log('--- LOGIN BEM-SUCEDIDO ---'); // LOG 2
                console.log('Perfil do usuário:', perfil); // LOG 3

                // --- LÓGICA DE REDIRECIONAMENTO COM LOGS ---
                
                const currentUrl = new URL(window.location.href);
                const redirectUrl = currentUrl.searchParams.get('redirect');
                
                console.log('URL atual:', currentUrl.href); // LOG 4
                console.log('Parâmetro "redirect" encontrado:', redirectUrl); // LOG 5

                if (redirectUrl) {
                    console.log('DECISÃO: Redirecionando para "redirectUrl":', redirectUrl); // LOG 6
                    router.push(redirectUrl); 

                } else if (perfil === 'admin' || perfil === 'bibliotecario') {
                    console.log('DECISÃO: Sem redirect. Redirecionando para /admin/dashboard (perfil admin/biblio)'); // LOG 7
                    router.push('/admin/dashboard');

                } else {
                    console.log('DECISÃO: Sem redirect. Redirecionando para /dashboard (perfil comum)'); // LOG 8
                    router.push('/dashboard');
                }
                
                return; // Para a execução aqui

            } else { // Tratamento de erros
                console.log('--- LOGIN FALHOU ---', response.status); // LOG 9
                 if (response.status === 401 || response.status === 403) {
                    setUi({
                        status: 'error', kind: 'error',
                        message: data?.message || 'Login ou senha inválidos.',
                        fieldErrors: { identifier: '', password: '' }
                    });
                 } else { // Erro 500 ou outros
                    setUi({
                        status: 'error', kind: 'error',
                        message: data?.message || 'Serviço indisponível.',
                        fieldErrors: {}
                    });
                 }
            }
        } catch (error){
            console.error("Erro na chamada da API de login:", error);
            setUi({
                status: 'error', kind: 'error',
                message: 'Falha de conexão. Verifique sua internet.',
                fieldErrors: {}
            });
        }
    };

    // --- JSX do Formulário (mantido como antes) ---
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
                        {/* Exibição de erro específica (se houver) */}
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
                         {/* Exibição de erro específica (se houver) */}
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