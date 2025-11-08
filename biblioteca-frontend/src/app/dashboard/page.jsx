// app/dashboard/page.jsx (Com Edição de Perfil via MODAL)

'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
// Adiciona ícones necessários
import { BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit, BsBoxArrowRight, BsPencilSquare, BsSave, BsXCircle, BsPersonBadge } from 'react-icons/bs';
import Alert from '@/components/Alert'; // Componente Alert para feedback
import Swal from 'sweetalert2';
import EditProfileModal from '@/components/EditProfileModal'; // --- MUDANÇA: Garantir que está importado

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionStatus, setActionStatus] = useState({ message: '', type: '' });

    // --- ESTADOS PARA EDIÇÃO DE PERFIL ---
    const [isEditing, setIsEditing] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ nome: '', email: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    
    // --- MUDANÇA: Estado do Modal (já estava no seu código, o que é ótimo) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    // ------------------------------------

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // useEffect (NENHUMA MUDANÇA NECESSÁRIA AQUI)
    useEffect(() => {
        document.title = 'Meu Painel - Biblioteca Fatec ZL';
        const checkAuthAndFetchData = async () => {
            setIsLoading(true);
            setActionStatus({ message: '', type: '' });
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
                    return;
                }
                const data = await response.json();
                setUser(data);
                setProfileFormData({ nome: data.nome, email: data.email });
            } catch (error) {
                console.error('Falha na autenticação/fetch:', error);
                setActionStatus({ message: 'Erro ao carregar dados. Redirecionando para login.', type: 'error'});
                setTimeout(() => router.push('/login'), 2000);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuthAndFetchData();
        const handlePageShow = (event) => { if (event.persisted) window.location.reload(); };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [router, apiUrl]);

    // handleLogout (NENHUMA MUDANÇA NECESSÁRIA AQUI)
    const handleLogout = async () => {
        try {
            await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) { console.error('Falha ao fazer logout API:', error); }
        router.push('/login');
    };

    // --- FUNÇÕES PARA EDIÇÃO DE PERFIL ---

    // --- MUDANÇA: Ativa o MODO DE EDIÇÃO e ABRE O MODAL ---
    const handleEditProfileClick = () => {
        if (!user) return;
        // Garante que o form comece com os dados mais recentes do estado 'user'
        setProfileFormData({
            nome: user.nome,
            email: user.email,
        });
        setIsModalOpen(true); // <-- ABRE O MODAL
        setIsEditing(true); // <-- Avisa que estamos editando
        setActionStatus({ message: '', type: '' }); // Limpa mensagens
    };

    // --- MUDANÇA: Renomeado para "handleModalClose". Fecha o modal e o modo de edição ---
    const handleModalClose = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setActionStatus({ message: '', type: '' });
    };

    // --- MUDANÇA: handleProfileFormChange foi REMOVIDO
    // O modal que fizemos usa `setProfileFormData` diretamente, o que é mais limpo.
    // Não precisamos mais dessa função aqui.

    // --- MUDANÇA: Submete a atualização. Agora recebe 'formData' do modal, NÃO um 'event'.
    const handleProfileUpdateSubmit = async (formData) => {
        // event.preventDefault(); // <-- REMOVIDO
        setIsUpdating(true);
        setActionStatus({ message: '', type: '' }); // Limpa alertas antigos da PÁGINA

        // Validação (agora usa 'formData' vindo do modal)
        if (!formData.nome || formData.nome.trim().length < 2) {
             Swal.fire({ icon: 'error', title: 'Erro', text: 'Nome inválido (mínimo 2 caracteres).', confirmButtonColor: '#b20000' });
             setIsUpdating(false);
             return;
        }
        if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
             Swal.fire({ icon: 'error', title: 'Erro', text: 'Formato de e-mail inválido.', confirmButtonColor: '#b20000' });
             setIsUpdating(false);
             return;
        }

        try {
            const response = await fetch(`${apiUrl}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ // Envia os dados do 'formData'
                    nome: formData.nome.trim(),
                    email: formData.email.trim().toLowerCase()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Sucesso! Atualiza o estado local 'user'
                setUser(data.user || { ...user, ...formData });

                // --- MUDANÇA: Fecha o modal e sai do modo de edição ---
                handleModalClose(); 
                
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Perfil atualizado com sucesso!',
                    confirmButtonText: 'Ok',
                    confirmButtonColor: '#28a745'
                });
            } else {
                // Erro (API)
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: data.message || 'Não foi possível atualizar o perfil.',
                    confirmButtonText: 'Tente Novamente',
                    confirmButtonColor: '#b20000'
                });
            }
        } catch (error) {
            // Erro (Rede)
            console.error("Erro ao atualizar perfil:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de Rede',
                text: 'Não foi possível conectar ao servidor.',
                confirmButtonText: 'Tente Novamente',
                confirmButtonColor: '#b20000'
            });
        } finally {
            setIsUpdating(false);
        }
    };
    // ------------------------------------

    // --- Renderização Condicional (isLoading, !user) (NENHUMA MUDANÇA) ---
    if (isLoading) {
        return <div className={styles.loading}>A carregar dados...</div>;
    }
    if (!user) {
        return (
            <div className={styles.container}>
                <Alert kind={actionStatus.type || 'error'} message={actionStatus.message || 'Não foi possível carregar os dados do usuário.'} />
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

                    {/* Alerta (mantido, caso seja útil para outros alertas) */}
                    {actionStatus.message && (
                        <Alert
                            kind={actionStatus.type}
                            message={actionStatus.message}
                            className={styles.actionAlert}
                        />
                    )}

                    {/* --- MUDANÇA: MODO DE EXIBIÇÃO (REMOVIDO o '!isEditing') --- */}
                    {/* Esta parte agora é exibida SEMPRE */}
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

                        {/* Botão Editar Perfil (Agora chama a função que abre o modal) */}
                        <div className={styles.editButtonWrapper}>
                            <button onClick={handleEditProfileClick} className={`${styles.button} ${styles.editButton}`}>
                                <BsPencilSquare /> Editar Perfil
                            </button>
                        </div>
                    </div>

                    {/* --- MUDANÇA: MODO DE EDIÇÃO (Formulário) --- */}
                    {/* O BLOCO INTEIRO de '{isEditing && ( ... )}' FOI REMOVIDO DAQUI */}
                    

                    {/* --- MUDANÇA: Botão Sair (REMOVIDO o '!isEditing') --- */}
                    <div className={styles.logoutButtonWrapper}>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            <BsBoxArrowRight /> Sair
                        </button>
                    </div>

                </div>
            </div>

            {/* --- MUDANÇA: O MODAL É ADICIONADO AQUI --- */}
            {/* Ele é renderizado aqui, mas só aparece quando 'isModalOpen' é true */}
            <EditProfileModal
                user={user}
                isOpen={isModalOpen}
                onClose={handleModalClose} // Função para fechar (botão Cancelar ou clique fora)
                setIsEditing={setIsEditing}
                profileFormData={profileFormData}
                setProfileFormData={setProfileFormData} // Passa a função de ATUALIZAR o estado
                handleProfileUpdateSubmit={handleProfileUpdateSubmit} // Passa a função de SUBMIT
                isUpdating={isUpdating}
            />
        </>
    );
}