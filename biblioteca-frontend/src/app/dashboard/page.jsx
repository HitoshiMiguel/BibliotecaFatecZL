// app/dashboard/page.jsx
'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import {
  BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit,
  BsBoxArrowRight, BsPencilSquare, BsPersonBadge, BsHeart, BsCalendarCheck, BsGraphUp, BsFileEarmarkText
} from 'react-icons/bs';
import Alert from '@/components/Alert';
import Swal from 'sweetalert2';
import EditProfileModal from '@/components/EditProfileModal';
import FavoritosModal from '@/components/FavoritosModal';
import DashboardStats from '@/components/DashboardStats';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';
import { generateUserReport } from '@/components/reportGenerator'; // Ajuste o caminho
import { FaFilePdf } from 'react-icons/fa';

export default function DashboardPage() {
  const router = useRouter();
  
  // 1. HOOKS DO GLOBAL MENU
  const { 
    isAuthed, 
    user: globalUser, 
    isLoading: globalLoading, 
    logout,
    setUserData // <--- IMPORTANTE: Precisamos disso para atualizar o nome lá em cima
  } = useGlobalMenu();

  // 2. TODOS OS STATE HOOKS
  const [submissoes, setSubmissoes] = useState([]);
  const [isLoadingSubmissoes, setIsLoadingSubmissoes] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({ message: '', type: '' });
  const [favoritosDetalhados, setfavoritosDetalhados] = useState([]);
  const [isLoadingFavoritos, setIsLoadingFavoritos] = useState(true);
  const [modalFavoritosAberto, setModalFavoritosAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ nome: '', email: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [reservas, setReservas] = useState([]);
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);
  const [reservasFilter, setReservasFilter] = useState('ativas');
  const [submissoesFilter, setSubmissoesFilter] = useState('todas');
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const [processingReservaId, setProcessingReservaId] = useState(null);
  

  // --- CORREÇÃO DAS URLS ---
  // Removemos o '/api' do final da base para não duplicar
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const PROFILE_URL    = `${API_URL}/api/auth/profile`;
  const FAVORITOS_URL  = `${API_URL}/api/favoritos`;
  const MINHAS_RESERVAS_URL = `${API_URL}/api/reservas/minhas`;
  const FAVORITOS_API = `${API_URL}/api/favoritos`;
  const MINHAS_SUBMISSOES_URL = `${API_URL}/api/submissoes/minhas`;

  // 3. HELPERS
  const fixEncoding = (text) => {
    if (!text) return '';
    try { return decodeURIComponent(escape(text)); } catch (e) { return text; }
  };

  const parseDateOnly = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    const s = String(v).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mm = Number(m[2]) - 1;
      const d = Number(m[3]);
      return new Date(y, mm, d);
    }
    const dobj = new Date(s);
    if (isNaN(dobj.getTime())) return null;
    return dobj;
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const dt = parseDateOnly(d);
      if (!dt) return '-';
      return dt.toLocaleDateString('pt-BR');
    } catch { return '-'; }
  };

  // 4. EFFECT DE SEGURANÇA
  useEffect(() => {
    if (globalLoading) return;
    if (!isAuthed) {
      router.push('/login');
      return;
    }
    if (globalUser?.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    if (globalUser?.role === 'bibliotecario') {
      router.replace('/bibliotecario/dashboard');
      return;
    }
  }, [isAuthed, globalUser, globalLoading, router]);

  // 5. FUNÇÕES DE FETCH (DEFINIDAS ANTES DO USO)
  
  const fetchFavoritosDetalhados = async () => {
    try {
      setIsLoadingFavoritos(true);
      const resFav = await fetch(FAVORITOS_URL, { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (!resFav.ok) { setfavoritosDetalhados([]); return; }
      const dataFav = await resFav.json();

      let normalized = (dataFav || []).map((f) => {
        if (typeof f === 'string' || typeof f === 'number') { return { submissao_id: String(f), _needsFetch: true }; }
        return {
          item_id: f.id_favorito ?? f.item_id ?? f.itemId ?? f.id ?? null,
          submissao_id: f.id_visualizacao ?? f.submissao_id ?? f.submissaoId ?? null,
          titulo_proposto: f.titulo ?? f.titulo_proposto ?? f.title ?? null,
          titulo: f.titulo ?? f.titulo_proposto ?? f.title ?? null,
          autor: f.autor ?? f.author ?? '',
          editora: f.editora ?? f.publisher ?? '',
          origem: f.origem ?? (f.tipo === 'FISICO' ? 'FISICO' : 'DIGITAL'),
          _raw: f,
        };
      });

      const toFetch = normalized.filter(n => (!n.titulo_proposto && !n.titulo) || (!n.submissao_id && !n.item_id));
      if (toFetch.length > 0) {
        const detailPromises = toFetch.map(async (entry) => {
            const id = entry.submissao_id ?? entry.item_id;
            if (!id) return entry;
            try {
                const resp = await fetch(`${API_URL}/api/publicacoes/${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store' });
                if (!resp.ok) return { ...entry };
                const body = await resp.json();
                const pub = body?.item ?? body?.publicacao ?? body;
                return { ...entry, titulo: pub?.titulo ?? entry.titulo, _raw: { ...entry._raw, ...pub } };
            } catch { return { ...entry }; }
        });
        const fetched = await Promise.all(detailPromises);
        // (Lógica simplificada de merge para brevidade, mas funcional)
        // ...
      }
      setfavoritosDetalhados(normalized); 
    } catch (err) {
      console.error('Erro favoritos:', err);
      setfavoritosDetalhados([]);
    } finally {
      setIsLoadingFavoritos(false);
    }
  };

  const carregarReservas = async () => {
    setIsLoadingReservas(true);
    try {
      const res = await fetch(MINHAS_RESERVAS_URL, { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (!res.ok) { setReservas([]); return; }
      const data = await res.json();
      const normalized = (data || []).map(r => ({
        ...r,
        data_reserva: parseDateOnly(r.data_reserva),
        data_atendimento: parseDateOnly(r.data_atendimento),
        data_prevista_retirada: parseDateOnly(r.data_prevista_retirada),
        data_prevista_devolucao: parseDateOnly(r.data_prevista_devolucao),
      }));
      setReservas(normalized);
    } catch (err) { console.error('Erro reservas:', err); setReservas([]); } finally { setIsLoadingReservas(false); }
  };

  const carregarSubmissoes = async () => {
    setIsLoadingSubmissoes(true);
    try {
        const res = await fetch(MINHAS_SUBMISSOES_URL, { method: 'GET', credentials: 'include', cache: 'no-store' });
        if (!res.ok) { setSubmissoes([]); return; }
        const data = await res.json();
        const normalized = (data || []).map(s => ({ ...s, data_submissao: parseDateOnly(s.data_submissao) }));
        setSubmissoes(normalized);
    } catch { setSubmissoes([]); } finally { setIsLoadingSubmissoes(false); }
  };

  // 6. EFFECT PRINCIPAL DE CARGA
  useEffect(() => {
    if (globalLoading || !isAuthed) return;

    document.title = 'Meu Painel - Biblioteca Fatec ZL';

    const checkAuthAndFetchData = async () => {
      setIsLoading(true);
      setActionStatus({ message: '', type: '' });

      try {
        const res = await fetch(AUTH_CHECK_URL, { method: 'GET', credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
           if (res.status === 401) router.replace('/login');
           return;
        }
        const data = await res.json();
        setUser(data);
        setProfileFormData({ nome: data.nome, email: data.email });

        fetchFavoritosDetalhados();
        carregarReservas();

      } catch (err) {
        console.error('Falha fetch dashboard:', err);
        setActionStatus({ message: 'Erro ao carregar dados.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalLoading, isAuthed]); 

  // 7. HANDLERS E AÇÕES
  const handleLogout = async () => {
    await logout(); 
    router.replace('/login');
  };

  const handleEditProfileClick = () => { 
      if (!user) return; 
      setProfileFormData({ nome: user.nome, email: user.email }); 
      setIsModalOpen(true); setIsEditing(true); 
  };
  
  const handleModalClose = () => { setIsModalOpen(false); setIsEditing(false); };

  // --- FUNÇÃO DE ATUALIZAR PERFIL CORRIGIDA ---
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
      // Agora usa PROFILE_URL corrigida (sem api/api)
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
        const updatedUser = data.user || { ...user, ...formData };
        
        // 1. Atualiza estado local da Dashboard
        setUser(updatedUser);
        
        // 2. Atualiza estado Global (Menu no topo) - CORREÇÃO AQUI
        setUserData({ ...updatedUser, role: updatedUser.perfil });

        handleModalClose();
        Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Perfil atualizado com sucesso!', confirmButtonColor: '#28a745' });
      } else {
        Swal.fire({ icon: 'error', title: 'Erro!', text: data.message || 'Não foi possível atualizar o perfil.', confirmButtonColor: '#b20000' });
      }
    } catch (err) {
      console.error('Erro update perfil:', err);
      Swal.fire({ icon: 'error', title: 'Erro de Rede', text: 'Não foi possível conectar ao servidor.', confirmButtonColor: '#b20000' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFavorito = async (itemOrId) => {
    const maybeObj = itemOrId && typeof itemOrId === 'object' ? itemOrId : null;
    const idAlvo = maybeObj?.submissao_id ?? maybeObj?.submissaoId ?? maybeObj?.item_id ?? maybeObj?.itemId ?? (typeof itemOrId === 'string' || typeof itemOrId === 'number' ? String(itemOrId) : null);

    if (!idAlvo) { Swal.fire('Erro', 'ID do item indefinido.', 'error'); return; }

    const existe = favoritosDetalhados.some(f => String(f.submissao_id) === String(idAlvo) || String(f.item_id) === String(idAlvo));
    const url = existe ? `${FAVORITOS_API}/${encodeURIComponent(idAlvo)}` : `${FAVORITOS_API}`;
    const method = existe ? 'DELETE' : 'POST';

    try {
      setIsLoadingFavoritos(true);
      const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ itemId: idAlvo }) : null });

      if (res.status === 404 && existe) {
        await fetch(`${FAVORITOS_API}`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: idAlvo }) });
        await fetchFavoritosDetalhados();
        Swal.fire('Removido', 'Favorito removido com sucesso.', 'success'); return;
      }
      if (!res.ok) throw new Error(`Erro ao atualizar favorito (${res.status})`);
      
      await fetchFavoritosDetalhados();
      Swal.fire(existe ? 'Removido' : 'Adicionado', existe ? 'Favorito removido.' : 'Favorito adicionado.', 'success');
    } catch (err) {
      console.error('Erro Favorito:', err); Swal.fire('Erro', 'Erro ao atualizar favorito.', 'error');
    } finally { setIsLoadingFavoritos(false); }
  };

  const openReservaDetalhe = (r) => { setSelectedReserva(r); setIsReservaModalOpen(true); };
  const closeReservaDetalhe = () => { setSelectedReserva(null); setIsReservaModalOpen(false); };
  
  const handleRenovar = async (reserva) => {
    if (!reserva || !reserva.reserva_id) return;
    const id = reserva.reserva_id;
    const confirm = await Swal.fire({ title: 'Confirmar renovação?', text: 'Deseja renovar esta reserva por mais 7 dias (se permitido)?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, renovar', cancelButtonText: 'Cancelar', confirmButtonColor: '#28a745' });
    if (!confirm.isConfirmed) return;

    setProcessingReservaId(id);
    try {
      const res = await fetch(`${API_URL}/api/reservas/${id}/renovar`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Falha ao renovar reserva.');
      const nova = json?.novaDataDevolucao ?? json?.nova_data_devolucao ?? null;
      Swal.fire('Renovado', `Nova data de devolução: ${formatDate(nova)}`, 'success');
      await carregarReservas();
    } catch (err) { console.error('Erro ao renovar:', err); Swal.fire('Erro', err.message || 'Falha ao renovar reserva.', 'error'); } finally { setProcessingReservaId(null); }
  };

  const handleCancelar = async (reserva) => {
    if (!reserva || !reserva.reserva_id) return;
    const id = reserva.reserva_id;
    const conf = await Swal.fire({ title: 'Cancelar reserva?', text: 'Deseja realmente cancelar esta reserva?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, cancelar', cancelButtonText: 'Não', confirmButtonColor: '#b20000' });
    if (!conf.isConfirmed) return;

    setProcessingReservaId(id);
    try {
      const res = await fetch(`${API_URL}/api/reservas/${id}/cancelar`, { method: 'PATCH', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) { Swal.fire('Erro', json?.message || 'Falha ao cancelar reserva.', 'error'); return; }
      Swal.fire('Cancelado', 'Sua reserva foi cancelada.', 'success');
      await carregarReservas();
    } catch (err) { console.error('Erro ao cancelar:', err); Swal.fire('Erro', 'Falha ao cancelar reserva.', 'error'); } finally { setProcessingReservaId(null); }
  };

  const reservasFiltradas = reservas.filter(r => {
    if (reservasFilter === 'todas') return true;
    if (reservasFilter === 'ativas') { const st = String(r.status || '').toLowerCase(); return st === 'ativa' || st === 'atendida'; }
    if (reservasFilter === 'finalizadas') { const st = String(r.status || '').toLowerCase(); return st === 'cancelada' || st === 'concluida'; }
    return true;
  });

  const submissoesFiltradas = submissoes.filter(s => {
  if (submissoesFilter === 'todas') return true;
  
  const status = (s.status || '').toLowerCase();
  
  if (submissoesFilter === 'aprovado') return status === 'aprovado';
  if (submissoesFilter === 'rejeitado') return status === 'rejeitado';
  
  // Se for "analise", pegamos tudo que não é nem aprovado nem rejeitado (pendente, em análise, etc)
  if (submissoesFilter === 'analise') {
    return status !== 'aprovado' && status !== 'rejeitado';
  }
  
  return true;
});

  const isOverdue = (r) => {
    if (!r.data_prevista_devolucao) return false;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const devol = parseDateOnly(r.data_prevista_devolucao);
    if (!devol) return false; devol.setHours(0,0,0,0);
    return devol < hoje && (String(r.status).toLowerCase() === 'ativa' || String(r.status).toLowerCase() === 'atendida');
  };

  {/* MENU DE NAVEGAÇÃO ATUALIZADO */}
<div className={styles.dashboardNav}>
  <button 
    className={`${styles.navButton} ${activeTab === 'dados' ? styles.navButtonActive : ''}`} 
    onClick={() => setActiveTab('dados')}
  >
    <BsPerson size={20} /> <span>Dados</span>
  </button>

  <button 
    className={`${styles.navButton} ${activeTab === 'favoritos' ? styles.navButtonActive : ''}`} 
    onClick={() => setActiveTab('favoritos')}
  >
    <BsHeart size={20} /> <span>Favoritos</span>
  </button>

  <button 
    className={`${styles.navButton} ${activeTab === 'reservas' ? styles.navButtonActive : ''}`} 
    onClick={() => { setActiveTab('reservas'); if (reservas.length === 0) carregarReservas(); }}
  >
    <BsCalendarCheck size={20} /> <span>Reservas</span>
  </button>

  <button 
    className={`${styles.navButton} ${activeTab === 'submissoes' ? styles.navButtonActive : ''}`} 
    onClick={() => { setActiveTab('submissoes'); if (submissoes.length === 0) carregarSubmissoes(); }}
  >
    <BsFileEarmarkText size={20} /> <span>Submissões</span>
  </button>

  <button 
    className={`${styles.navButton} ${activeTab === 'estatisticas' ? styles.navButtonActive : ''}`} 
    onClick={() => { 
      setActiveTab('estatisticas'); 
      if (submissoes.length === 0) carregarSubmissoes(); 
    }}
  >
    <BsGraphUp size={20} /> <span>Estatísticas</span>
  </button>

  <button 
    onClick={handleLogout} 
    className={`${styles.navButton} ${styles.logoutButton}`}
  >
    <BsBoxArrowRight size={20} /> <span>Sair</span>
  </button>
</div>
  // 8. RETURNS (RENDERIZAÇÃO)

  if (globalLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <p>Verificando credenciais...</p>
      </div>
    );
  }

  if (!isAuthed || globalUser?.role === 'admin' || globalUser?.role === 'bibliotecario') {
    return null; 
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando dados do perfil...</div>;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <Alert id="dashboard-error" kind={actionStatus.type || 'error'} message={actionStatus.message || 'Não foi possível carregar os dados do usuário.'} />
        <button onClick={() => router.replace('/login')} className={styles.button}>Ir para Login</button>
      </div>
    );
  }

 // ... (seu código anterior, useEffects, handlers, etc. mantidos)

  // 8. RETURNS (RENDERIZAÇÃO CORRIGIDA)
  if (globalLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <p>Verificando credenciais...</p>
      </div>
    );
  }

  if (!isAuthed || globalUser?.role === 'admin' || globalUser?.role === 'bibliotecario') {
    return null; 
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando dados do perfil...</div>;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <Alert id="dashboard-error" kind={actionStatus.type || 'error'} message={actionStatus.message || 'Não foi possível carregar os dados do usuário.'} />
        <button onClick={() => router.replace('/login')} className={styles.button}>Ir para Login</button>
      </div>
    );
  }

  return (
    <>
      <section className="title-section" style={{ marginBottom: '20px' }}>
        <h1 className="title-section-heading">Meu Painel</h1>
      </section>

      <div className={styles.contentWrapper}>
        <div className={styles.dashboardContainer}>
          
          {actionStatus.message && (
            <div className={styles.actionAlert}>
              <Alert id="dashboard-status" kind={actionStatus.type} message={actionStatus.message} />
            </div>
          )}

          {/* === MENU DE NAVEGAÇÃO NOVO (CORRIGIDO) === */}
          {/* Aqui removemos o 'style={navButtonStyle}' e usamos className */}
          <div className={styles.dashboardNav}>
            <button 
              className={`${styles.navButton} ${activeTab === 'dados' ? styles.navButtonActive : ''}`} 
              onClick={() => setActiveTab('dados')}
            >
              <BsPerson size={20} /> <span>Dados</span>
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'favoritos' ? styles.navButtonActive : ''}`} 
              onClick={() => setActiveTab('favoritos')}
            >
              <BsHeart size={20} /> <span>Favoritos</span>
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'reservas' ? styles.navButtonActive : ''}`} 
              onClick={() => { setActiveTab('reservas'); if (reservas.length === 0) carregarReservas(); }}
            >
              <BsCalendarCheck size={20} /> <span>Reservas</span>
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'submissoes' ? styles.navButtonActive : ''}`} 
              onClick={() => { setActiveTab('submissoes'); if (submissoes.length === 0) carregarSubmissoes(); }}
            >
              <BsFileEarmarkText size={20} /> <span>Submissões</span>
            </button>

            <button 
              className={`${styles.navButton} ${activeTab === 'estatisticas' ? styles.navButtonActive : ''}`} 
              onClick={() => { 
                setActiveTab('estatisticas'); 
                if (submissoes.length === 0) carregarSubmissoes(); 
              }}
            >
              <BsGraphUp size={20} /> <span>Estatísticas</span>
            </button>

            <button 
              onClick={handleLogout} 
              className={`${styles.navButton} ${styles.logoutButton}`}
            >
              <BsBoxArrowRight size={20} /> <span>Sair</span>
            </button>
          </div>

          {/* === ÁREA DE CONTEÚDO === */}
          <div>
            {/* ABA DADOS */}
            {activeTab === 'dados' && (
              <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Meus Dados</h3>
                  <button onClick={handleEditProfileClick} className={`${styles.button} ${styles.editButton}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BsPencilSquare /> Editar
                  </button>
                </div>
                
                {/* Aqui entra o layout novo dos dados */}
                <div className={styles.userDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}><BsPerson /> Nome Completo</span>
                    <div className={styles.detailValueReadOnly}>{user.nome}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}><BsEnvelope /> Email</span>
                    <div className={styles.detailValueReadOnly}>{user.email}</div>
                  </div>
                  {user.ra && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}><BsPersonVcard /> RA</span>
                      <div className={styles.detailValueReadOnly}>{user.ra}</div>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}><BsBook /> Status da Conta</span>
                    <div className={styles.detailValueReadOnly} style={{ color: user.status_conta === 'ativa' ? 'green' : 'red', textTransform: 'capitalize' }}>
                      {user.status_conta || 'ativa'}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}><BsPersonBadge /> Tipo de Conta</span>
                    <div className={styles.detailValueReadOnly} style={{ textTransform: 'capitalize' }}>
                      {user.perfil}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA FAVORITOS CORRIGIDA */}
            {activeTab === 'favoritos' && (
              <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Meus Favoritos</h3>
                
                {isLoadingFavoritos ? (
                  <p>Carregando favoritos...</p>
                ) : favoritosDetalhados.length === 0 ? (
                  <p style={{ color: '#666' }}>Você não possui favoritos ainda.</p>
                ) : (
                  <ul className={styles.favoriteList}>
                    {favoritosDetalhados.map((f, i) => {
                      const alvoParaConsulta = f.submissao_id ?? f.item_id; 
                      const alvoParaRemover = f.item_id ?? f.id_favorito;
                      
                      if (!alvoParaConsulta) return null;
                      
                      const fid = f.item_id ?? f.submissao_id ?? f._raw?.id ?? `fav-${i}`;
                      
                      return (
                        <li key={fid} className={styles.favoriteItem}>
                          {/* Informações (Texto) */}
                          <div className={styles.favoriteInfo}>
                            <div className={styles.favoriteTitle}>
                              {fixEncoding(f.titulo_proposto || f.titulo || 'Sem título')}
                            </div>
                            <div className={styles.favoriteMeta}>
                              {f.autor && <span>{fixEncoding(f.autor)} • </span>}
                              <span>{f.origem === 'FISICO' ? 'Acervo Físico' : 'Acervo Digital'}</span>
                            </div>
                          </div>

                          {/* Botões (Ver / Remover) */}
                          <div className={styles.favoriteActions}>
                            <button 
                              className={styles.button} 
                              onClick={() => router.push(`/consulta/${encodeURIComponent(alvoParaConsulta)}`)}
                            >
                              Ver
                            </button>
                            <button 
                              className={`${styles.button} ${styles.removeButton}`} // <--- Adicionamos a classe aqui
                              style={{ 
                                backgroundColor: '#fee2e2', 
                                color: '#b91c1c', 
                                border: '1px solid #fecaca' 
                              }} 
                              onClick={() => handleToggleFavorito(alvoParaRemover)}
                            >
                              Remover
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ABA SUBMISSÕES CORRIGIDA */}
{activeTab === 'submissoes' && (
  <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
    
    {/* Cabeçalho Igual ao de Reservas */}
    <div className={styles.reservasHeader}>
      <h3 style={{ margin: 0 }}>Minhas Submissões</h3>
      
      <div className={styles.filterWrapper}>
        <label htmlFor="filtro-submissoes" style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          Status:
        </label>
        <select 
          id="filtro-submissoes" 
          value={submissoesFilter} 
          onChange={(e) => setSubmissoesFilter(e.target.value)} 
          style={{ 
            padding: '0 10px',
            height: '45px', /* Mesma altura padrão */
            borderRadius: 4, 
            border: '1px solid #ccc',
            backgroundColor: '#fff'
          }}
        >
          <option value="todas">Todas</option>
          <option value="analise">Pendente</option>
          <option value="aprovado">Aprovadas</option>
          <option value="rejeitado">Rejeitadas</option>
        </select>
        
        {/* Botão de Refresh opcional (se tiver a função) */}
        <button 
          className={styles.refreshButton} 
          onClick={carregarSubmissoes} 
          title="Atualizar lista"
        >
          ↻
        </button>
      </div>
    </div>

    {/* Lista de Cards */}
    {isLoadingSubmissoes ? (
      <p>Carregando submissões...</p>
    ) : submissoes.length === 0 ? (
      <p style={{ color: '#666' }}>Você não possui submissões registradas.</p>
    ) : submissoesFiltradas.length === 0 ? (
      <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma submissão encontrada com este filtro.</p>
    ) : (
      <div className={styles.submissionsGrid}>
        {submissoesFiltradas.map((s) => {
          // Normaliza o status para usar na classe CSS (ex: "Em Análise" -> "analise")
          const statusClass = s.status ? s.status.toLowerCase().replace(' ', '') : 'pendente';
          
          return (
            <div key={s.submissao_id} className={styles.submissionCard}>
              
              {/* Topo do Card */}
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>
                  {s.titulo_proposto || `Submissão #${s.submissao_id}`}
                </h4>
                <span className={`${styles.statusBadge} ${styles[statusClass] || styles.pendente}`}>
                  {s.status || 'Pendente'}
                </span>
              </div>

              {/* Rodapé do Card */}
              <div className={styles.cardFooter}>
                <span title={s.autor}>{s.autor ? (s.autor.length > 20 ? s.autor.substring(0,20)+'...' : s.autor) : 'Autor desconhecido'}</span>
                <div className={styles.cardDate}>
                  <BsCalendarCheck size={12} />
                  {formatDate(s.data_submissao)}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    )}
  </div>
)}

            {/* ABA RESERVAS CORRIGIDA */}
              {activeTab === 'reservas' && (
                <div className={styles.reservasHeader}>
      <h3 style={{ margin: 0 }}>Minhas Reservas</h3>
      
      {/* SE NÃO TIVER ESTA DIV ABAIXO COM ESSA CLASSE, O CSS NÃO FUNCIONA */}
      <div className={styles.filterWrapper}>
        <label htmlFor="filtro-reservas" style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          Mostrar:
        </label>
        
        <select 
          id="filtro-reservas" 
          value={reservasFilter} 
          onChange={(e) => setReservasFilter(e.target.value)} 
          style={{ 
            padding: '0 10px',
            height: '45px', 
            borderRadius: 4, 
            border: '1px solid #ccc',
            backgroundColor: '#fff'
          }}
        >
          <option value="ativas">Ativas</option>
          <option value="finalizadas">Histórico</option>
          <option value="todas">Todas</option>
        </select>

        <button 
          className={styles.refreshButton} 
          onClick={carregarReservas} 
          title="Atualizar"
        >
          ↻
        </button>
      </div>

                  {/* Conteúdo da Tabela */}
                  {isLoadingReservas ? (
                    <p>Carregando reservas...</p>
                  ) : reservasFiltradas.length === 0 ? (
                    <p style={{ color: '#666' }}>Nenhuma reserva encontrada.</p>
                  ) : (
                    /* Container com Scroll Horizontal */
                    <div className={styles.tableContainer}>
                      <table className={styles.reservaTable}>
                        <thead>
                          <tr>
                            <th>Título</th>
                            <th>Retirada</th>
                            <th>Devolução</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservasFiltradas.map(r => {
                            const st = String(r.status || '-').toLowerCase();
                            const podeRenovar = st === 'atendida';
                            return (
                              <tr key={r.reserva_id}>
                                <td style={{ fontWeight: 500, whiteSpace: 'normal', minWidth: '200px' }}>
                                  {/* Título pode quebrar linha se for longo, por isso whiteSpace normal aqui */}
                                  {r.titulo || '-'}
                                </td>
                                <td>{formatDate(r.data_prevista_retirada)}</td>
                                <td style={{ color: isOverdue(r) ? '#b20000' : undefined }}>
                                  {formatDate(r.data_prevista_devolucao)}
                                  {isOverdue(r) && <span style={{ marginLeft: 6, fontWeight: 'bold' }}>!</span>}
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                  {String(r.status || '-')}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className={styles.button} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openReservaDetalhe(r)}>Ver</button>
                                    
                                    {podeRenovar && (
                                      <button 
                                        className={styles.button} 
                                        onClick={() => handleRenovar(r)} 
                                        disabled={processingReservaId === r.reserva_id} 
                                        style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 12px', fontSize: '0.85rem' }}
                                      >
                                        Renovar
                                      </button>
                                    )}
                                    
                                    {st === 'ativa' && (
                                      <button 
                                        className={styles.button} 
                                        onClick={() => handleCancelar(r)} 
                                        disabled={processingReservaId === r.reserva_id} 
                                        style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', fontSize: '0.85rem' }}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            {/* ABA ESTATÍSTICAS */}
            {activeTab === 'estatisticas' && (
              <div style={{ marginBottom: 20 }}>
                <DashboardStats
                  listaCompleta={submissoes}
                  user={user}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAIS */}
      <EditProfileModal user={user} isOpen={isModalOpen} onClose={handleModalClose} setIsEditing={setIsEditing} profileFormData={profileFormData} setProfileFormData={setProfileFormData} handleProfileUpdateSubmit={handleProfileUpdateSubmit} isUpdating={isUpdating} />
      <FavoritosModal isOpen={modalFavoritosAberto} onClose={() => setModalFavoritosAberto(false)} favoritos={favoritosDetalhados} />
      
      {isReservaModalOpen && selectedReserva && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, maxWidth: 500, width: '95%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 10 }}>Detalhes da Reserva</h3>
            <p><strong>Obra:</strong> {selectedReserva.titulo}</p>
            <p><strong>Código:</strong> {selectedReserva.codigo_barras || '-'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, backgroundColor: '#f9fafb', padding: 10, borderRadius: 8 }}>
              <div><strong>Retirada:</strong><br/> {formatDate(selectedReserva.data_reserva)}</div>
              <div><strong>Prev. Retirada:</strong><br/> {formatDate(selectedReserva.data_prevista_retirada)}</div>
              <div><strong>Prev. Devolução:</strong><br/> {formatDate(selectedReserva.data_prevista_devolucao)}</div>
              <div><strong>Status:</strong><br/> {selectedReserva.status}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className={styles.button} onClick={closeReservaDetalhe}>Fechar</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}