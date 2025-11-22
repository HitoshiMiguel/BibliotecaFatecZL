// app/dashboard/page.jsx

'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import {
  BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit,
  BsBoxArrowRight, BsPencilSquare, BsPersonBadge, BsHeart, BsCalendarCheck
} from 'react-icons/bs';
import Alert from '@/components/Alert';
import Swal from 'sweetalert2';
import EditProfileModal from '@/components/EditProfileModal';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';
import FavoritosModal from '@/components/FavoritosModal';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({ message: '', type: '' });

  // Favoritos
  const [favoritosDetalhados, setfavoritosDetalhados] = useState([]);
  const [isLoadingFavoritos, setIsLoadingFavoritos] = useState(true);
  const [modalFavoritosAberto, setModalFavoritosAberto] = useState(false);

  // edição de perfil (via modal)
  const [isEditing, setIsEditing] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ nome: '', email: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [reservaModalAberto, setReservaModalAberto] = useState(false);
  const [dataRetirada, setDataRetirada] = useState('');
  const [criandoReserva, setCriandoReserva] = useState(false);
  const [erroReserva, setErroReserva] = useState('');
  const [etapaReserva, setEtapaReserva] = useState('data'); // 'data' | 'confirmacao'
  const [livroEmprestado, setLivroEmprestado] = useState(null);
  const [isLoadingEmprestimo, setIsLoadingEmprestimo] = useState(true);

  // ---- BASE + ENDPOINTS ----
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`; // usa a sua rota original
  const LOGOUT_URL     = `${API_URL}/api/auth/logout`;
  const PROFILE_URL    = `${API_URL}/api/auth/profile`;
  const FAVORITOS_URL  = `${API_URL}/api/favoritos/detalhes`;

  // ---- LOGOUT DO MENU LATERAL
  const { logout } = useGlobalMenu();

  // Guard + fetch do usuário logado (via cookie httpOnly)
  useEffect(() => {
    document.title = 'Meu Painel - Biblioteca Fatec ZL';

    const EMPRESTIMO_URL = `${API_URL}/api/reservas/usuario/atual`;
    const checkAuthAndFetchData = async () => {
      setIsLoading(true);
      setIsLoadingFavoritos(true);
      setIsLoadingEmprestimo(true); // <--- Inicia loading
      setActionStatus({ message: '', type: '' });

      try {
        const res = await fetch(AUTH_CHECK_URL, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        

        if (!res.ok) {
          // 👉 trata 401 / 403 / 404 como "não autenticado"
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            console.warn('Usuário não autenticado ou rota não encontrada, redirecionando para login...');
            router.replace('/login');
            return;
          }

          // outros erros: só mostra mensagem, sem "throw"
          console.error(`Falha ao buscar dados: ${res.status}`);
          setActionStatus({
            message: `Erro ao carregar dados do usuário (código ${res.status}).`,
            type: 'error',
          });
          return;
        }

        const data = await res.json();
        setUser(data);
        setProfileFormData({ nome: data.nome, email: data.email });

        try {
          const resFav = await fetch(FAVORITOS_URL, {
            method: 'GET',
            credentials: 'include', // Essencial para enviar o cookie de auth
            cache: 'no-store',
          });
          
          if (resFav.ok) {
            const dataFav = await resFav.json(); // Ex: [1, 5, 22]
            setfavoritosDetalhados(dataFav);
          } else {
            // Não quebra a página se favoritos falhar, apenas avisa no console
            console.warn(`Falha ao carregar favoritos: ${resFav.status}`);
          }
        } catch (favErr) {
          console.error('Erro ao buscar favoritos:', favErr);
        } finally {
          setIsLoadingFavoritos(false); // [NOVO] Termina o loading (só dos favoritos)
        }

        try {
            const resEmp = await fetch(EMPRESTIMO_URL, {
                method: 'GET',
                credentials: 'include', // Importante para passar o cookie
                cache: 'no-store'
            });
            
            if (resEmp.ok) {
                const dataEmp = await resEmp.json();
                // O backend retorna { ativo: true, dados: {...} } ou { ativo: false }
                if (dataEmp.ativo) {
                    setLivroEmprestado(dataEmp.dados);
                } else {
                    setLivroEmprestado(null);
                }
            }
        } catch (errorEmp) {
            console.warn("Erro ao buscar empréstimo:", errorEmp);
        } finally {
            setIsLoadingEmprestimo(false);
        }

      } catch (err) {
        console.error('Falha na autenticação/fetch:', err);
        setActionStatus({
          message: 'Erro ao carregar dados. Redirecionando para login.',
          type: 'error',
        });
        setTimeout(() => router.replace('/login'), 1500);
      } finally {
        setIsLoading(false); // Termina o loading principal (usuário)
      }
    };

    checkAuthAndFetchData();

    // evita “back cache” reexibindo sem checar
    const handlePageShow = (e) => { 
      if (e.persisted) window.location.reload(); 
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router, AUTH_CHECK_URL, FAVORITOS_URL]);

  // Logout
  const handleLogout = async () => {
    
    await logout();

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
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Nome inválido (mínimo 2 caracteres).',
        confirmButtonColor: '#b20000'
      });
      setIsUpdating(false);
      return;
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Formato de e-mail inválido.',
        confirmButtonColor: '#b20000'
      });
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
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Perfil atualizado com sucesso!',
          confirmButtonColor: '#28a745'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: data.message || 'Não foi possível atualizar o perfil.',
          confirmButtonColor: '#b20000'
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro de Rede',
        text: 'Não foi possível conectar ao servidor.',
        confirmButtonColor: '#b20000'
      });
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
        <Alert
          id="dashboard-error"
          kind={actionStatus.type || 'error'}
          message={actionStatus.message || 'Não foi possível carregar os dados do usuário.'}
        />
        <button onClick={() => router.replace('/login')} className={styles.button}>
          Ir para Login
        </button>
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
            // ... (seu Alert de actionStatus) ...
            <div className={styles.actionAlert}>
              <Alert
                id="dashboard-status"
                kind={actionStatus.type}
                message={actionStatus.message}
              />
            </div>
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

            {/* --- [NOVO] Bloco de Favoritos --- */}
            <div 
              className={`${styles.detailItem} ${styles.clickableItem}`} // Adicione uma classe se quiser estilizar o hover
              onClick={() => setModalFavoritosAberto(true)}
              style={{ cursor: 'pointer' }} // Estilo rápido para mostrar que é clicável
              role="button"
              tabIndex={0}
              aria-label="Abrir lista de favoritos"
              onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && setModalFavoritosAberto(true)} // Acessibilidade
            >
              <span className={styles.detailLabel}><BsHeart /> Meus Favoritos</span>
              <span className={styles.detailValue}>
                {isLoadingFavoritos
                  ? 'A carregar...'
                  // [MODIFICADO] Usa o .length da nova lista
                  : `${favoritosDetalhados.length} item(ns) salvos` 
                }
              </span>
            </div>
            {/* --- Fim do Bloco de Favoritos --- */}

            {/* --- BLOCO DE STATUS ATUAL (PADRONIZADO) --- */}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <BsBook /> Status Atual
              </span>
              
              {/* A mágica é colocar tudo DENTRO desta div com a classe detailValue */}
              <div 
                className={styles.detailValue} 
                style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' }}
              >
                {isLoadingEmprestimo ? (
                   <span style={{ color: '#666', fontSize: '0.9rem' }}>Verificando...</span>
                ) : livroEmprestado ? (
                  <>
                    {/* 1. Título do Livro */}
                    <strong style={{ color: '#000', fontSize: '0.95rem' }}>
                        {livroEmprestado.titulo}
                    </strong>

                    {/* 2. Status (Texto Colorido em vez de Bloco com Fundo) */}
                    {livroEmprestado.status === 'ativa' ? (
                        // STATUS: AGUARDANDO (Laranja Escuro)
                        <span style={{ 
                            color: '#c2410c', // Laranja escuro para ler bem no cinza
                            fontWeight: '600', 
                            fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '6px' 
                        }}>
                            <BsHourglassSplit /> 
                            Aguardando Retirada
                            <span style={{ fontWeight: '400', color: '#444', fontSize: '0.85rem' }}>
                                — até {new Date(livroEmprestado.data_retirada).toLocaleDateString('pt-BR')}
                            </span>
                        </span>
                    ) : (
                        // STATUS: EMPRESTADO (Verde Escuro)
                        <span style={{ 
                            color: '#15803d', // Verde escuro
                            fontWeight: '600', 
                            fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '6px' 
                        }}>
                            <BsCalendarCheck /> 
                            Empréstimo Ativo
                            <span style={{ fontWeight: '400', color: '#444', fontSize: '0.85rem' }}>
                                — devolver até {new Date(livroEmprestado.data_devolucao).toLocaleDateString('pt-BR')}
                            </span>
                        </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#555' }}>Nenhuma pendência no momento.</span>
                )}
              </div>
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
              <button
                onClick={handleEditProfileClick}
                className={`${styles.button} ${styles.editButton}`}
              >
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

      <FavoritosModal
        isOpen={modalFavoritosAberto}
        onClose={() => setModalFavoritosAberto(false)}
        favoritos={favoritosDetalhados}
      />
    </>
  );
}
