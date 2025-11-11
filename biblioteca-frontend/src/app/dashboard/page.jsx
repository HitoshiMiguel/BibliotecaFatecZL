// app/dashboard/page.jsx

'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import {
  BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit,
  BsBoxArrowRight, BsPencilSquare, BsPersonBadge
} from 'react-icons/bs';
import Alert from '@/components/Alert';
import Swal from 'sweetalert2';
import EditProfileModal from '@/components/EditProfileModal';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({ message: '', type: '' });

  // edição de perfil (via modal)
  const [isEditing, setIsEditing] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ nome: '', email: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---- BASE + ENDPOINTS (corrigidos para /api/auth/...) ----
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const LOGOUT_URL     = `${API_URL}/api/auth/logout`;
  const PROFILE_URL    = `${API_URL}/api/auth/profile`;

  // Guard + fetch do usuário logado (via cookie httpOnly)
  useEffect(() => {
    document.title = 'Meu Painel - Biblioteca Fatec ZL';

    const checkAuthAndFetchData = async () => {
      setIsLoading(true);
      setActionStatus({ message: '', type: '' });

      try {
        const res = await fetch(AUTH_CHECK_URL, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace('/login');
            return;
          }
          throw new Error(`Falha ao buscar dados: ${res.status}`);
        }

        const data = await res.json();
        setUser(data);
        setProfileFormData({ nome: data.nome, email: data.email });
      } catch (err) {
        console.error('Falha na autenticação/fetch:', err);
        setActionStatus({ message: 'Erro ao carregar dados. Redirecionando para login.', type: 'error' });
        setTimeout(() => router.replace('/login'), 1500);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();

    // evita “back cache” reexibindo sem checar
    const handlePageShow = (e) => { if (e.persisted) window.location.reload(); };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router, AUTH_CHECK_URL]);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Falha ao fazer logout API:', e);
    }
    router.replace('/login');
  };

  // Abrir modal de edição
  const handleEditProfileClick = () => {
    if (!user) return;
    setProfileFormData({ nome: user.nome, email: user.email });
    setIsModalOpen(true);
    setIsEditing(true);
    setActionStatus({ message: '', type: '' });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setActionStatus({ message: '', type: '' });
  };

  // Submit da atualização (recebe dados do modal)
  const handleProfileUpdateSubmit = async (formData) => {
    setIsUpdating(true);
    setActionStatus({ message: '', type: '' });

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
      const res = await fetch(PROFILE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user || { ...user, ...formData });
        handleModalClose();
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Perfil atualizado com sucesso!', confirmButtonColor: '#28a745' });
      } else {
        Swal.fire({ icon: 'error', title: 'Erro!', text: data.message || 'Não foi possível atualizar o perfil.', confirmButtonColor: '#b20000' });
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      Swal.fire({ icon: 'error', title: 'Erro de Rede', text: 'Não foi possível conectar ao servidor.', confirmButtonColor: '#b20000' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>A carregar dados...</div>;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <Alert kind={actionStatus.type || 'error'} message={actionStatus.message || 'Não foi possível carregar os dados do usuário.'} />
        <button onClick={() => router.replace('/login')} className={styles.button}>Ir para Login</button>
      </div>
    );
  }

  return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Meus Dados</h1>
      </section>

      <div className={styles.contentWrapper}>
        <div className={styles.dashboardContainer}>
          {actionStatus.message && (
            <Alert kind={actionStatus.type} message={actionStatus.message} className={styles.actionAlert} />
          )}

          <div className={styles.userDetails}>
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

            <div className={styles.editButtonWrapper}>
              <button onClick={handleEditProfileClick} className={`${styles.button} ${styles.editButton}`}>
                <BsPencilSquare /> Editar Perfil
              </button>
            </div>
          </div>

          <div className={styles.logoutButtonWrapper}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <BsBoxArrowRight /> Sair
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        setIsEditing={setIsEditing}
        profileFormData={profileFormData}
        setProfileFormData={setProfileFormData}
        handleProfileUpdateSubmit={handleProfileUpdateSubmit}
        isUpdating={isUpdating}
      />
    </>
  );
}
