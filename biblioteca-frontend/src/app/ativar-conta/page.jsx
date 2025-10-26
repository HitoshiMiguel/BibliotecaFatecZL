// Ex: app/ativar-conta/page.jsx (Corrigido)

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
// Importe seus estilos, se tiver (ex: styles from './ativar.module.css')

export default function AtivarContaPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    // Lê o token da URL assim que o componente é montado
    const [token, setToken] = useState('');

    const [senha, setSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [message, setMessage] = useState(''); // Mensagens gerais (ex: erro inicial do token)
    const [error, setError] = useState(''); // Erros específicos do formulário/API
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false); // Controla se o formulário deve ser exibido

    // Efeito para ler o token da URL e definir o título
    useEffect(() => {
        document.title = 'Ativar Conta - Biblioteca Fatec ZL'; // Título correto
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            setShowForm(true); // Token encontrado, mostra o formulário
            setMessage(''); // Limpa mensagens iniciais
        } else {
            setMessage('Token de ativação inválido ou ausente na URL.');
            setShowForm(false); // Não mostra formulário se não houver token
        }
    }, [searchParams]); // Re-executa se searchParams mudar (geralmente só na carga inicial)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Limpa mensagens anteriores
        setError('');   // Limpa erros anteriores

        // Validações básicas no frontend
        if (!token) {
             setError('Token inválido ou expirado.'); // Erro se tentarem submeter sem token
             return;
        }
        if (senha !== confirmar) {
             setError('As senhas não coincidem.');
             return;
        }
        if (senha.length < 8) {
             setError('A senha deve ter pelo menos 8 caracteres.');
             return;
        }

        setIsLoading(true);
        try {
            // Chama a API backend para ativar
            const response = await fetch('http://localhost:4000/api/auth/ativar-conta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, senha }),
            });

            const data = await response.json();

            if (response.ok) { // Status 200 OK
                 // Usa Swal para sucesso
                 await Swal.fire({
                    icon: 'success',
                    title: 'Conta Ativada!',
                    text: 'Sua senha foi definida com sucesso. Você já pode fazer login.',
                    timer: 2500, // Tempo maior
                    showConfirmButton: false,
                 });
                 router.push('/login'); // Redireciona para login
            } else {
                // Erro do backend (token inválido, expirado, erro ao salvar senha)
                 setError(data.message || 'Não foi possível ativar a conta.'); // Mostra erro específico
                 // Opcional: Usar Swal para erro também
                 // Swal.fire('Erro', data.message || 'Não foi possível ativar a conta.', 'error');
            }

        } catch (error) {
            console.error("Erro ao ativar conta:", error);
            setError('Falha de conexão ao tentar ativar a conta.'); // Mostra erro de rede
            // Swal.fire('Erro', 'Falha de conexão ao tentar ativar a conta.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos inline básicos (adapte ou use CSS Modules)
    const styles = {
        container: { fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '50px auto', padding: '30px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' },
        formGroup: { marginBottom: '15px', textAlign: 'left'},
        label: { display: 'block', marginBottom: '5px', fontWeight: 'bold'},
        input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'},
        button: { padding: '12px 25px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1em'},
        errorMessage: { color: 'red', marginTop: '10px', fontWeight: 'bold' },
        infoMessage: { color: '#555', marginTop: '10px' }
    };


    // --- Renderização ---
    return (
        <div style={styles.container}>
            <h1>Ativar Conta e Definir Senha</h1>

            {/* Mostra mensagem inicial ou de erro se o formulário não for exibido */}
            {!showForm && message && <p style={styles.errorMessage}>{message}</p>}
            {!showForm && <button onClick={() => router.push('/login')} style={styles.button}>Ir para Login</button>}


            {/* Mostra o formulário APENAS se houver token */}
            {showForm && (
                <form onSubmit={handleSubmit}>
                    {/* Mostra erros da submissão */}
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    {/* Pode mostrar mensagens informativas */}
                    {message && <p style={styles.infoMessage}>{message}</p>}


                    <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="senha">Nova Senha:</label>
                        <input
                            style={styles.input}
                            id="senha" type="password" value={senha}
                            onChange={(e) => setSenha(e.target.value)} required
                            placeholder='Mínimo 8 caracteres'
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="confirmar">Confirmar Senha:</label>
                        <input
                             style={styles.input}
                            id="confirmar" type="password" value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)} required
                            placeholder='Repita a nova senha'
                        />
                    </div>
                    <button type="submit" style={styles.button} disabled={isLoading || !token}>
                        {isLoading ? 'A ativar...' : 'Ativar Conta e Salvar Senha'}
                    </button>
                </form>
            )}
        </div>
    );
}