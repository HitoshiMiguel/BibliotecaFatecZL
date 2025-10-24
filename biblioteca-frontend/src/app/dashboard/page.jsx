// dashboard.js ou app/dashboard/page.jsx

'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correto para App Router
import styles from './dashboard.module.css';
import { BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit, BsBoxArrowRight } from 'react-icons/bs';

export default function DashboardPage() {
    const router = useRouter();
    // Estado para guardar os dados do utilizador autenticado
    const [user, setUser] = useState(null); 
    // Estado para controlar o carregamento inicial
    const [isLoading, setIsLoading] = useState(true); 

    useEffect(() => {
        // Correção para recarregar em caso de navegação back/forward cacheada
        const handlePageShow = (event) => {
            if (event.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener('pageshow', handlePageShow);

        // Função para verificar a autenticação e buscar dados
        const checkAuthAndFetchData = async () => {
            try {
                // Tenta buscar os dados do utilizador. O browser envia o cookie.
                const response = await fetch('http://localhost:4000/api/auth/current-user', {
                    credentials: 'include', // Necessário para enviar cookies cross-origin
                    cache: 'no-store',      // Garante que não use cache
                });

                if (response.status === 401) {
                    // NÃO AUTENTICADO! Redireciona para o login.
                    console.log("Utilizador não autenticado, redirecionando para login...");
                    router.push('/login');
                    return; // Interrompe
                }

                if (!response.ok) {
                    // Outro erro da API (ex: 500)
                    console.error('Erro da API ao buscar utilizador:', response.status);
                    // Pode mostrar uma mensagem de erro ou redirecionar
                    throw new Error('Falha ao buscar dados do utilizador.'); 
                }

                // Autenticado! Guarda os dados
                const data = await response.json();
                setUser(data);

            } catch (error) {
                console.error('Falha na verificação de autenticação ou fetch:', error);
                // Em caso de erro (rede, API indisponível, etc.), redireciona para login
                router.push('/login'); 
            } finally {
                // Independentemente do resultado, para de carregar
                setIsLoading(false);
            }
        };

        checkAuthAndFetchData(); // Executa a verificação

        // Limpeza do event listener quando o componente desmonta
        return () => {
             window.removeEventListener('pageshow', handlePageShow);
        };
    }, [router]); // Dependência do router

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:4000/api/auth/logout', { method: 'POST', credentials: 'include' });
            // Após logout no backend, redireciona para o login no frontend
            router.push('/login'); 
            // Usar router.push é geralmente melhor que window.location.href em Next.js
        } catch (error) {
            console.error('Falha ao fazer logout:', error);
            // Mesmo se o logout falhar, tenta redirecionar
            router.push('/login');
        }
    };

    // --- Renderização Condicional ---

    if (isLoading) {
        // Mostra um ecrã de carregamento enquanto verifica
        return <div className={styles.loading}>A verificar autenticação...</div>; 
    }

    if (!user) {
         // Se não está a carregar e não tem utilizador, significa que foi redirecionado
         // ou houve um erro. Retornar null evita renderizar conteúdo indevido.
         return null; 
    }

    // --- Conteúdo Real do Dashboard (Só renderiza se autenticado e carregado) ---
    return (
        <>
            <section className="title-section">
                <h1 className="title-section-heading">Meus Dados</h1>
            </section>

            <div className={styles.contentWrapper}>
                <div className={styles.dashboardContainer}>

                    <div className={styles.userDetails}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}><BsPerson /> Meu Nome</span>
                            <span className={styles.detailValue}>{user.nome}</span>
                        </div>
                        {user.ra && ( // Mostra RA apenas se existir (não mostra para professor/admin)
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsPersonVcard /> Meu RA</span>
                                <span className={styles.detailValue}>{user.ra}</span>
                            </div>
                        )}
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}><BsEnvelope /> Email</span>
                            <span className={styles.detailValue}>{user.email}</span>
                        </div>
                        {/* Itens de exemplo, ajuste conforme necessário */}
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}><BsBook /> Livro Atual</span>
                            <span className={styles.detailValue}>Nenhum livro emprestado</span> 
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}><BsHourglassSplit /> Status da Conta</span>
                             {/* Mostra o status real vindo da API */}
                            <span className={styles.detailValue}>{user.status_conta || 'ativa'}</span>
                        </div>
                    </div>

                    <div className={styles.logoutButtonWrapper}>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            <BsBoxArrowRight />
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}