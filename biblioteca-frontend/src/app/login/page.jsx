// No seu ficheiro da PÁGINA DE LOGIN (ex: app/login/page.jsx ou pages/login.js)

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css'; // Mantenha o seu CSS
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';

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

        try {
            // Chama a API de login (URL corrigida)
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
                credentials: 'include', // Necessário para cookies httpOnly cross-origin
            });

            // Tenta ler o corpo da resposta JSON (mesmo em caso de erro)
            let data = {};
            try { data = await response.json(); } catch {}

            if (response.ok) { // Status 200-299
                setUi({ status: 'success', message: 'Login realizado com sucesso.', kind: 'success', fieldErrors: {} });

                // --- LÓGICA DE REDIRECIONAMENTO CONDICIONAL ---
                const perfil = data.perfil; // Pega o perfil retornado pela API
                console.log("Perfil recebido no login:", perfil); // Log para debug

                if (perfil === 'admin' || perfil === 'bibliotecario') {
                    // Se for admin ou bibliotecário, vai para o painel admin
                    router.push('/admin/dashboard'); 
                } else {
                    // Caso contrário (comum, professor), vai para o dashboard normal
                    router.push('/dashboard'); 
                }
                // ----------------------------------------------
                return; // Interrompe a execução aqui

            } else { // Tratamento de erros (mantido)
                 if (response.status === 401 || response.status === 403) {
                    setUi({
                        status: 'error', kind: 'error',
                        message: data?.message || 'Login ou senha inválidos.',
                        fieldErrors: { identifier: '', password: '' }
                    });
                 } else if (response.status === 422) { // Erro de validação (pouco provável no login)
                     setUi({
                         status: 'error', kind: 'error',
                         message: data?.message || 'Dados inválidos.',
                         fieldErrors: data?.fieldErrors || {}
                     });
                 } else { // Erro 500 ou outros
                    setUi({
                        status: 'error', kind: 'error',
                        message: data?.message || 'Serviço indisponível.',
                        fieldErrors: {}
                    });
                 }
            }
        } catch (error){ // Erro de rede/conexão
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