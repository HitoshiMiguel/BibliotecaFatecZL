// app/dashboard/page.jsx (Com Edição de Perfil)

'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
// Adiciona ícones necessários
import { BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit, BsBoxArrowRight, BsPencilSquare, BsSave, BsXCircle, BsPersonBadge } from 'react-icons/bs';
import Alert from '@/components/Alert'; // Componente Alert para feedback

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Estado para feedback geral ou de ações (como atualização de perfil)
    const [actionStatus, setActionStatus] = useState({ message: '', type: '' }); // type: 'success' or 'error'

    // --- ESTADOS PARA EDIÇÃO DE PERFIL ---
    const [isEditing, setIsEditing] = useState(false); // Controla visibilidade do form
    const [profileFormData, setProfileFormData] = useState({ nome: '', email: '' }); // Dados do formulário
    const [isUpdating, setIsUpdating] = useState(false); // Loading para o botão de guardar
    // ------------------------------------

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // useEffect para buscar dados e definir título (mantido)
    useEffect(() => {
        document.title = 'Meu Painel - Biblioteca Fatec ZL';

        // Função para verificar a autenticação e buscar dados
        const checkAuthAndFetchData = async () => {
            setIsLoading(true); // Garante que loading é true no início
            setActionStatus({ message: '', type: '' }); // Limpa mensagens
            try {
                const response = await fetch(`${apiUrl}/auth/current-user`, {
                    credentials: 'include', cache: 'no-store',
                });
                if (!response.ok) {
                    if (response.status === 401) {
                         console.log("Dashboard: Não autenticado, redirecionando...");
                         router.push('/login');
                    } else {
                         throw new Error(`Falha ao buscar dados: ${response.status}`);
                    }
                    return; // Interrompe se não OK
                }
                const data = await response.json();
                setUser(data); // Guarda os dados do utilizador
                setProfileFormData({ nome: data.nome, email: data.email }); // Preenche form inicial

            } catch (error) {
                console.error('Falha na autenticação/fetch:', error);
                setActionStatus({ message: 'Erro ao carregar dados. Redirecionando para login.', type: 'error'});
                setTimeout(() => router.push('/login'), 2000);
            } finally {
                setIsLoading(false); // Termina o carregamento inicial
            }
        };

        checkAuthAndFetchData(); // Executa a verificação

        // Limpeza de listener (mantido)
        const handlePageShow = (event) => { if (event.persisted) window.location.reload(); };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);

    }, [router, apiUrl]); // Adicionado apiUrl como dependência

    // Função de Logout (mantida)
    const handleLogout = async () => {
        try {
            await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) { console.error('Falha ao fazer logout API:', error); }
        router.push('/login');
    };

    // --- FUNÇÕES PARA EDIÇÃO DE PERFIL ---

    // Ativa o modo de edição e preenche o formulário (se user mudar)
    const handleEditProfileClick = () => {
        if (!user) return;
        // Garante que o form comece com os dados mais recentes do estado 'user'
        setProfileFormData({
            nome: user.nome,
            email: user.email,
        });
        setIsEditing(true);
        setActionStatus({ message: '', type: '' }); // Limpa mensagens
    };

    // Cancela o modo de edição
    const handleCancelEditProfile = () => {
        setIsEditing(false);
        // Não precisa limpar profileFormData, ele será repreenchido se editar novamente
        setActionStatus({ message: '', type: '' });
    };

    // Atualiza o estado do formulário de edição
    const handleProfileFormChange = (event) => {
        const { name, value } = event.target;
        setProfileFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Submete a atualização do perfil para a API
    const handleProfileUpdateSubmit = async (event) => {
        event.preventDefault();
        setIsUpdating(true);
        setActionStatus({ message: '', type: '' });

        // Validação básica frontend (nome e email)
        if (!profileFormData.nome || profileFormData.nome.trim().length < 2) {
             setActionStatus({ message: 'Nome inválido (mínimo 2 caracteres).', type: 'error' });
             setIsUpdating(false);
             return;
        }
         if (!profileFormData.email || !/^\S+@\S+\.\S+$/.test(profileFormData.email)) {
             setActionStatus({ message: 'Formato de e-mail inválido.', type: 'error' });
             setIsUpdating(false);
             return;
        }


        try {
            const response = await fetch(`${apiUrl}/auth/profile`, { // Chama a rota PUT /api/auth/profile
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Envia o cookie
                body: JSON.stringify({ // Envia apenas nome e email
                    nome: profileFormData.nome.trim(),
                    email: profileFormData.email.trim().toLowerCase()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Sucesso! Atualiza o estado local 'user' com os dados retornados pela API
                setUser(data.user || { ...user, ...profileFormData }); // Usa dados da API se disponíveis
                setIsEditing(false); // Sai do modo de edição
                setActionStatus({ message: 'Perfil atualizado com sucesso!', type: 'success' });
            } else {
                // Erro (ex: email duplicado 409, validação 400, servidor 500)
                setActionStatus({ message: data.message || 'Falha ao atualizar perfil.', type: 'error' });
            }
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            setActionStatus({ message: 'Erro de rede ao tentar atualizar.', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };
    // ------------------------------------

    // --- Renderização Condicional ---
    if (isLoading) {
        return <div className={styles.loading}>A carregar dados...</div>; // Mensagem durante busca inicial
    }
    if (!user) {
         // Se não está a carregar e não tem utilizador (após falha de auth/fetch)
         // Exibe a mensagem de erro definida no useEffect
         return (
             <div className={styles.container}>
                 <Alert kind={actionStatus.type || 'error'} message={actionStatus.message || 'Não foi possível carregar os dados do utilizador.'} />
                 <button onClick={() => router.push('/login')} className={styles.button}>Ir para Login</button>
             </div>
         );
    }

    // --- Conteúdo Real do Dashboard ---
    return (
        <>
            <section className="title-section">
                <h1 className="title-section-heading">Meus Dados</h1>
            </section>

            <div className={styles.contentWrapper}>
                <div className={styles.dashboardContainer}>

                    {/* Mostra mensagem de sucesso/erro da atualização */}
                    {actionStatus.message && (
                         <Alert
                            kind={actionStatus.type}
                            message={actionStatus.message}
                            // style={{ marginBottom: '20px' }} // Use classe CSS em vez de style
                            className={styles.actionAlert} // Nova classe para estilizar alerta
                         />
                    )}

                    {/* --- MODO DE EXIBIÇÃO --- */}
                    {!isEditing && (
                        <div className={styles.userDetails}>
                            {/* Detalhes do Utilizador */}
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsPerson /> Meu Nome</span>
                                <span className={styles.detailValue}>{user.nome}</span>
                            </div>
                            {user.ra && (
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><BsPersonVcard /> Meu RA</span>
                                    <span className={styles.detailValue}>{user.ra}</span>
                                </div>
                            )}
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsEnvelope /> Email</span>
                                <span className={styles.detailValue}>{user.email}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsBook /> Livro Atual</span>
                                <span className={styles.detailValue}>Nenhum livro emprestado</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsHourglassSplit /> Status da Conta</span>
                                <span className={styles.detailValue}>{user.status_conta || 'ativa'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsPersonBadge /> Tipo de Conta</span>
                                <span className={styles.detailValue}>{user.perfil}</span>
                            </div>

                            {/* Botão Editar Perfil */}
                            <div className={styles.editButtonWrapper}>
                                <button onClick={handleEditProfileClick} className={`${styles.button} ${styles.editButton}`}>
                                    <BsPencilSquare /> Editar Perfil
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- MODO DE EDIÇÃO (Formulário) --- */}
                    {isEditing && (
                        <form onSubmit={handleProfileUpdateSubmit} className={styles.editForm}>
                            <h3>Editar Perfil</h3>

                            {/* Campo Nome */}
                             <div className={styles.detailItem}>
                                <label className={styles.detailLabel} htmlFor="edit-nome"><BsPerson /> Meu Nome</label>
                                <input
                                    id="edit-nome"
                                    type="text"
                                    name="nome"
                                    value={profileFormData.nome}
                                    onChange={handleProfileFormChange}
                                    className={styles.editInput} // Classe para input editável
                                    required
                                />
                            </div>

                            {/* Campo Email */}
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel} htmlFor="edit-email"><BsEnvelope /> Email</label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    name="email"
                                    value={profileFormData.email}
                                    onChange={handleProfileFormChange}
                                    className={styles.editInput}
                                    required
                                />
                            </div>

                            {/* Campos Não Editáveis (Apenas Leitura) */}
                             {user.ra && (
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><BsPersonVcard /> Meu RA</span>
                                    <span className={styles.detailValueReadOnly}>{user.ra}</span>
                                </div>
                             )}
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsPersonBadge /> Tipo de Conta</span>
                                <span className={styles.detailValueReadOnly}>{user.perfil}</span>
                            </div>
                             <div className={styles.detailItem}>
                                <span className={styles.detailLabel}><BsHourglassSplit /> Status da Conta</span>
                                <span className={styles.detailValueReadOnly}>{user.status_conta || 'ativa'}</span>
                            </div>

                            {/* Botões de Ação */}
                            <div className={styles.formActions}>
                                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isUpdating}>
                                    <BsSave /> {isUpdating ? 'A guardar...' : 'Guardar Alterações'}
                                </button>
                                <button type="button" onClick={handleCancelEditProfile} className={`${styles.button} ${styles.cancelButton}`} disabled={isUpdating}>
                                    <BsXCircle /> Cancelar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Botão Sair (Fora do modo de edição) */}
                    {!isEditing && (
                        <div className={styles.logoutButtonWrapper}>
                            <button onClick={handleLogout} className={styles.logoutButton}>
                                <BsBoxArrowRight /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}