// Use 'use client' se estiver a usar o Next.js App Router
'use client';

import React, { useState, useEffect } from 'react'; // Adicionado useEffect
// CORREÇÃO: Usar 'next/navigation' para o App Router
import { useRouter } from 'next/navigation';

// Se estiver a usar CSS Modules, mantenha a sua importação original:
// import styles from './admin-test.module.css';

export default function AdminTestPage() {
    // Estados existentes
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Começa como false
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Começa como true para verificar auth
    const router = useRouter();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // --- useEffect PARA VERIFICAR AUTENTICAÇÃO ---
    useEffect(() => {
        const checkAuth = async () => {
             setIsLoading(true); // Indica que estamos a verificar
             setMessage('');
             try {
                // Tenta buscar os dados do utilizador logado
                const response = await fetch(`${apiUrl}/auth/current-user`, {
                    method: 'GET',
                    credentials: 'include', // Envia o cookie
                    cache: 'no-store',
                });

                if (response.ok) {
                    const data = await response.json();
                    // Verifica se o utilizador retornado é admin ou bibliotecário
                    if (data.perfil === 'admin' || data.perfil === 'bibliotecario') {
                        setIsLoggedIn(true); // Utilizador já está logado e é admin/biblio
                        // Busca solicitações automaticamente após confirmar auth
                        fetchSolicitacoes();
                    } else {
                        // Logado, mas não é admin/biblio - redireciona para dashboard normal
                        setMessage('Acesso negado. Redirecionando...');
                        router.push('/dashboard');
                    }
                } else if (response.status === 401) {
                    // Não está logado
                    setIsLoggedIn(false);
                    setMessage('Por favor, faça login como Administrador.');
                } else {
                     // Outro erro da API
                     throw new Error('Falha ao verificar status de login.');
                }
             } catch (error) {
                 console.error("Erro ao verificar autenticação inicial:", error);
                 setMessage('Erro ao verificar autenticação. Tente novamente.');
                 setIsLoggedIn(false); // Garante que não está logado em caso de erro
             } finally {
                 setIsLoading(false); // Termina o carregamento inicial
             }
        };

        checkAuth(); // Executa a verificação ao carregar a página
    }, [router]); // Dependência do router
    // ---------------------------------------------


    // Função para fazer login como Admin (usada APENAS se o useEffect falhar)
    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                if (data.perfil === 'admin' || data.perfil === 'bibliotecario') {
                    setIsLoggedIn(true);
                    setMessage('Login como Admin/Bibliotecário bem-sucedido!');
                    // Após login, busca automaticamente as solicitações
                    fetchSolicitacoes();
                } else {
                    setMessage('Erro: Este utilizador não tem permissão de administrador.');
                    setIsLoggedIn(false);
                }
            } else {
                setMessage(data.message || 'Falha no login.');
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            setMessage('Erro de rede ao tentar fazer login.');
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para buscar solicitações pendentes
    const fetchSolicitacoes = async () => {
        setMessage('');
        setIsLoading(true);
        setSolicitacoes([]);
        try {
            const response = await fetch(`${apiUrl}/admin/solicitacoes`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setSolicitacoes(data);
                if (data.length === 0) setMessage('Nenhuma solicitação pendente encontrada.');
            } else {
                setMessage(data.message || 'Falha ao buscar solicitações.');
                if (response.status === 401 || response.status === 403) setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Erro ao buscar solicitações:", error);
            setMessage('Erro de rede ao buscar solicitações.');
        } finally {
            setIsLoading(false);
        }
    };

    // Função para aprovar uma solicitação
    const handleAprovar = async (solicitacaoId) => {
         setMessage('');
         setIsLoading(true); // Pode usar um estado de loading específico para o botão se preferir
         try {
            const response = await fetch(`${apiUrl}/admin/solicitacoes/${solicitacaoId}/aprovar`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(`Solicitação ${solicitacaoId} aprovada! E-mail enviado para ${data.email}.`);
                setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
            } else {
                setMessage(data.message || `Falha ao aprovar ${solicitacaoId}.`);
                 if (response.status === 401 || response.status === 403) setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Erro ao aprovar solicitação:", error);
            setMessage('Erro de rede ao tentar aprovar.');
        } finally {
            setIsLoading(false); // Para o loading geral
        }
    };

    // Função de Logout
    const handleLogout = async () => {
         try {
            await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
         } catch {}
         setIsLoggedIn(false);
         setIdentifier('');
         setPassword('');
         setSolicitacoes([]);
         setMessage('Logout realizado.');
         // Redireciona para login após logout
         router.push('/login');
    }


    // --- Renderização Condicional ---

    // Mostra carregamento durante a verificação inicial de autenticação
    if (isLoading && !isLoggedIn && solicitacoes.length === 0) {
        return <div style={inlineStyles.container}>A verificar autenticação...</div>;
    }

    return (
        <div style={inlineStyles.container}>
            <h1>Página de Teste Admin</h1>

            {/* Mostra mensagens (erro/sucesso) */}
            {message && <p style={inlineStyles.message}>{message}</p>}

            {!isLoggedIn ? (
                // --- Formulário de Login ---
                <form onSubmit={handleLogin} style={inlineStyles.form}>
                    <h2>Login Admin / Bibliotecário</h2>
                     <div style={inlineStyles.inputGroup}>
                        <label htmlFor="adminId">Email:</label>
                        <input type="email" id="adminId" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="admin@fatec.com" style={inlineStyles.input} />
                    </div>
                    <div style={inlineStyles.inputGroup}>
                        <label htmlFor="adminPass">Senha:</label>
                        <input type="password" id="adminPass" value={password} onChange={(e) => setPassword(e.target.value)} required style={inlineStyles.input} />
                    </div>
                    <button type="submit" disabled={isLoading} style={isLoading ? {...inlineStyles.button, ...inlineStyles.buttonDisabled} : inlineStyles.button}>
                        {isLoading ? 'A entrar...' : 'Entrar como Admin'}
                    </button>
                </form>
            ) : (
                // --- Painel Admin Logado ---
                <div>
                    <h2>Painel de Aprovação</h2>
                    <button onClick={fetchSolicitacoes} disabled={isLoading} style={isLoading ? {...inlineStyles.button, ...inlineStyles.buttonDisabled} : inlineStyles.button}>
                        {isLoading ? 'A buscar...' : 'Buscar Solicitações Pendentes'}
                    </button>
                     <button onClick={handleLogout} style={{...inlineStyles.button, ...inlineStyles.logoutButton}}>
                        Sair (Logout)
                    </button>

                    {/* Lista de Solicitações */}
                     {/* Mostra "carregando" apenas quando está a buscar e a lista está vazia */}
                     {isLoading && solicitacoes.length === 0 && <p>A carregar solicitações...</p>}

                    {!isLoading && solicitacoes.length > 0 && (
                        <div style={inlineStyles.listContainer}>
                            <h3>Solicitações Pendentes:</h3>
                            <ul style={inlineStyles.list}>
                                {solicitacoes.map((sol) => (
                                    <li key={sol.solicitacao_id} style={inlineStyles.listItem}>
                                         <span>ID: {sol.solicitacao_id}</span>
                                        <span>Nome: {sol.nome}</span>
                                        <span>Email: {sol.email}</span>
                                        <button onClick={() => handleAprovar(sol.solicitacao_id)} disabled={isLoading} style={isLoading ? {...inlineStyles.button, ...inlineStyles.approveButton, ...inlineStyles.buttonDisabled} : {...inlineStyles.button, ...inlineStyles.approveButton}}>
                                            {/* Usar um estado de loading por item seria ideal, mas para simplificar: */}
                                            {isLoading ? '...' : 'Aprovar'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* Mensagem de "Nenhuma solicitação" */}
                     {!isLoading && solicitacoes.length === 0 && message.includes('Nenhuma') && <p>Nenhuma solicitação pendente.</p>}
                </div>
            )}
        </div>
    );
}

// --- Estilos CSS Básicos (Inline) ---
const inlineStyles = {
     container: { fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    button: { padding: '10px 15px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', marginRight: '10px', marginTop: '10px' },
    buttonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
    logoutButton: { backgroundColor: '#dc3545'},
    message: { padding: '10px', marginBottom: '15px', border: '1px solid', borderRadius: '4px', backgroundColor: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24' }, // Estilo de erro padrão
    listContainer: { marginTop: '20px' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { borderBottom: '1px solid #eee', padding: '15px 5px', marginBottom: '10px', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
    approveButton: { backgroundColor: '#28a745', marginLeft: 'auto' }
};