'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cadastro.module.css'; // Mantenha o seu CSS
import Link from 'next/link';
import Alert from '@/components/Alert';
import '@/styles/feedback.css';
import { BsPersonPlus, BsEye, BsEyeSlash } from 'react-icons/bs'; // Importe ícones se precisar

export default function CadastroPage() {
    // Estados existentes
    const [nome, setNome] = useState('');
    const [ra, setRa] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar senha

    // --- NOVO ESTADO PARA CONTROLAR O PERFIL ---
    const [perfilSelecionado, setPerfilSelecionado] = useState('aluno'); // Começa como aluno
    // -----------------------------------------

    // Estados de UI e Erros
    const [ui, setUi] = useState({ status: 'idle', message: '', kind: 'error' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Refs existentes
    const nomeRef = useRef(null);
    const emailRef = useRef(null);
    // Adicionar Ref para RA se quiser focar nele
    const raRef = useRef(null);

    const router = useRouter();

    // --- Definir o título da página dinamicamente ---
    useEffect(() => {
        document.title = 'Cadastro - Biblioteca Fatec ZL'; // Define o título da aba
    }, []);

    // Lógica de foco em caso de erro (ajustada para incluir RA)
    useEffect(() => {
        if (Object.keys(errors).length) {
            if (errors.nome && nomeRef.current) return nomeRef.current.focus();
            if (errors.ra && raRef.current) return raRef.current.focus(); // Foca no RA se houver erro
            if (errors.email && emailRef.current) return emailRef.current.focus();
            // Adicione refs para senha se necessário
        }
    }, [errors]);

    // Função para alternar o perfil
    const togglePerfil = (novoPerfil) => {
        if (perfilSelecionado !== novoPerfil) {
            setPerfilSelecionado(novoPerfil);
            // Limpa o campo RA e erros relacionados ao RA se mudar para professor
            if (novoPerfil === 'professor') {
                setRa('');
                setErrors(prev => {
                    const { ra, ...rest } = prev; // Remove o erro de RA
                    return rest;
                });
            }
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setUi({ status: 'idle', message: '', kind: 'error' });
        setErrors({});

        // Validação de senhas no frontend (mantida)
        if (senha !== confirmarSenha) {
            setErrors({ confirmarSenha: 'As senhas não coincidem.' });
            setIsLoading(false);
            return;
        }

        // --- Monte o objeto de dados a ser enviado ---
        const dadosCadastro = {
            nome,
            email,
            // Envia RA apenas se for aluno, caso contrário envia null ou string vazia
            ra: perfilSelecionado === 'aluno' ? ra : null,
            senha,
            confirmarSenha,
            // --- USA O ESTADO PARA DEFINIR O PERFIL ---
            perfilSolicitado: perfilSelecionado
            // --------------------------------------
        };

        try {
            // Chama a API de cadastro correta
            const response = await fetch('http://localhost:4000/api/auth/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCadastro),
            });

            const data = await response.json().catch(() => ({})); // Previne erro se não houver JSON

            if (response.ok || response.status === 201 || response.status === 202) {
                // Sucesso (201 para aluno, 202 para professor)
                 let successMessage = data.message || (perfilSelecionado === 'aluno'
                    ? 'Cadastro realizado com sucesso! Faça o login.'
                    : 'Solicitação enviada! Aguarde a aprovação administrativa.');

                 setUi({ status: 'success', message: successMessage, kind: 'success' });
                 // Redireciona para login após um tempo
                 setTimeout(() => router.push('/login'), 2500);

            } else if ((response.status === 400 || response.status === 422) && data.errors) {
                 // Erros de validação do backend (tratamento melhorado)
                 const fieldErrors = data.errors.reduce((acc, err) => {
                    // Mapeia erro de 'perfilSolicitado' para uma mensagem geral se necessário
                    if (err.path === 'perfilSolicitado') {
                        acc['geral'] = err.msg; // Ou exibe no Alert
                    } else {
                        acc[err.path] = err.msg;
                    }
                    return acc;
                 }, {});
                 setUi({
                    status: 'error',
                    message: fieldErrors.geral || 'Corrija os campos destacados.', // Mensagem geral ou específica
                    kind: 'error'
                 });
                 setErrors(fieldErrors);

            } else {
                 // Outros erros (409 - Duplicado, 500 - Servidor)
                 throw new Error(data?.message || 'Erro ao realizar o cadastro.');
            }

        } catch (err) {
             setUi({ status: 'error', message: err.message || 'Falha de conexão. Verifique sua internet.', kind: 'error' });
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

                    {/* --- BOTÕES DE TOGGLE PARA PERFIL --- */}
                    <div className={styles.perfilToggle}>
                        <button
                            type="button"
                            onClick={() => togglePerfil('aluno')}
                            className={perfilSelecionado === 'aluno' ? styles.active : ''}
                        >
                            Sou Aluno
                        </button>
                        <button
                            type="button"
                            onClick={() => togglePerfil('professor')}
                            className={perfilSelecionado === 'professor' ? styles.active : ''}
                        >
                            Sou Professor
                        </button>
                    </div>
                    {/* ------------------------------------ */}

                    <div className={styles.field}>
                        <label htmlFor="nome">Nome *</label>
                        <input
                            ref={nomeRef} type="text" id="nome" name="nome" value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className={errors.nome ? 'input-invalid' : ''}
                        />
                        {errors.nome && <small className="field-error">{errors.nome}</small>}
                    </div>

                    {/* --- CAMPO RA CONDICIONAL --- */}
                    <div className={styles.field} style={{ display: perfilSelecionado === 'aluno' ? 'block' : 'none' }}>
                        <label htmlFor="ra">RA *</label>
                        <input
                            ref={raRef} // Adiciona ref
                            type="text" id="ra" name="ra" value={ra}
                            onChange={(e) => setRa(e.target.value)}
                            // required só é validado pelo backend, mas é bom ter no HTML
                            required={perfilSelecionado === 'aluno'} 
                            disabled={perfilSelecionado === 'professor'} // Desativa o campo
                            minLength={13} maxLength={13}
                            className={errors.ra ? 'input-invalid' : ''}
                        />
                        {/* Mostra erro de RA apenas se for aluno */}
                        {perfilSelecionado === 'aluno' && errors.ra && <small className="field-error">{errors.ra}</small>}
                    </div>
                    {/* --------------------------- */}

                    <div className={styles.field}>
                        <label htmlFor="email">E-mail *</label>
                        <input
                            ref={emailRef} type="email" id="email" name="email" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={errors.email ? 'input-invalid' : ''}
                        />
                        {errors.email && <small className="field-error">{errors.email}</small>}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="senha">Senha *</label>
                        {/* Adiciona o wrapper para o ícone de olho */}
                         <div className={styles.passwordWrapper}> 
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="senha" name="senha" value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required minLength={8}
                                className={errors.senha ? 'input-invalid' : ''}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                                {showPassword ? <BsEyeSlash /> : <BsEye />}
                            </button>
                        </div>
                        {errors.senha && <small className="field-error">{errors.senha}</small>}
                    </div>

                    <div className={styles.field}>
                <label htmlFor="confirmarSenha">Confirmar Senha *</label>
                {/* Adiciona o wrapper para o ícone de olho */}
                <div className={styles.passwordWrapper}>
                    <input
                        type={showPassword ? 'text' : 'password'} // Controlado pelo MESMO estado showPassword
                        id="confirmarSenha"
                        name="confirmarSenha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                        className={errors.confirmarSenha ? 'input-invalid' : ''}
                    />
                    {/* Botão para mostrar/ocultar */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)} // Usa a mesma função de toggle
                        className={styles.eyeIcon}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {showPassword ? <BsEyeSlash /> : <BsEye />}
                    </button>
                </div>
                {errors.confirmarSenha && <small className="field-error">{errors.confirmarSenha}</small>}
            </div>
            {/* ------------------------------------------- */}

            {/* Botão de Submit e Link de Login */}
            <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
                <BsPersonPlus /> {/* Ícone */}
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