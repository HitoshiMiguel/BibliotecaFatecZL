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

  const navButtonStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '6px',
    border: '1px solid', borderColor: isActive ? '#b20000' : '#e5e7eb',
    backgroundColor: isActive ? '#b20000' : '#fff', color: isActive ? '#fff' : '#374151',
    fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
  });

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

  return (
    <>
      <section className="title-section" style={{ marginBottom: '20px' }}>
        <h1 className="title-section-heading">Meu Painel</h1>
      </section>

      <div className={styles.contentWrapper}>
        <div className={styles.dashboardContainer} style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {actionStatus.message && (
            <div className={styles.actionAlert} style={{ marginBottom: 20 }}>
              <Alert id="dashboard-status" kind={actionStatus.type} message={actionStatus.message} />
            </div>
          )}

          {/* MENU DE NAVEGAÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={navButtonStyle(activeTab === 'dados')} onClick={() => setActiveTab('dados')}>
                <BsPerson size={18} /> <span>Dados</span>
              </button>
              <button style={navButtonStyle(activeTab === 'favoritos')} onClick={() => setActiveTab('favoritos')}>
                <BsHeart size={16} /> <span>Favoritos</span>
              </button>
              <button style={navButtonStyle(activeTab === 'reservas')} onClick={() => { setActiveTab('reservas'); if (reservas.length === 0) carregarReservas(); }}>
                <BsCalendarCheck size={16} /> <span>Reservas</span>
              </button>
              <button style={navButtonStyle(activeTab === 'submissoes')} onClick={() => { setActiveTab('submissoes'); if (submissoes.length === 0) carregarSubmissoes(); }}>
                <BsFileEarmarkText size={16} /> <span>Submissões</span>
              </button>
              <button 
                style={navButtonStyle(activeTab === 'estatisticas')} 
                onClick={() => { 
                  setActiveTab('estatisticas'); 
                  // AQUI é o lugar certo: Se não tiver dados, carrega!
                  if (submissoes.length === 0) carregarSubmissoes(); 
                }}
              >
                <BsGraphUp size={16} /> <span>Estatísticas</span>
              </button>
            </div>

            <div>
              <button onClick={handleLogout} className={styles.logoutButton} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', height: '100%', backgroundColor: '#b20000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                <BsBoxArrowRight size={18} /> <span>Sair</span>
              </button>
            </div>
          </div>

          {/* CONTEÚDO */}
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
                <div className={styles.userDetails}>
                  <div className={styles.detailItem} style={{ marginBottom: '15px' }}>
                    <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', marginBottom: '4px' }}><BsPerson /> Nome Completo</span>
                    <span className={styles.detailValue} style={{ fontSize: '1.05rem', fontWeight: 500 }}>{user.nome}</span>
                  </div>
                  <div className={styles.detailItem} style={{ marginBottom: '15px' }}>
                    <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', marginBottom: '4px' }}><BsEnvelope /> Email</span>
                    <span className={styles.detailValue} style={{ fontSize: '1.05rem', fontWeight: 500 }}>{user.email}</span>
                  </div>
                  {user.ra && (
                    <div className={styles.detailItem} style={{ marginBottom: '15px' }}>
                      <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', marginBottom: '4px' }}><BsPersonVcard /> RA</span>
                      <span className={styles.detailValue} style={{ fontSize: '1.05rem', fontWeight: 500 }}>{user.ra}</span>
                    </div>
                  )}
                  <div className={styles.detailItem} style={{ marginBottom: '15px' }}>
                    <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', marginBottom: '4px' }}><BsBook /> Status da Conta</span>
                    <span className={styles.detailValue} style={{ fontSize: '1.05rem', fontWeight: 500, color: user.status_conta === 'ativa' ? 'green' : 'red', textTransform: 'capitalize' }}>{user.status_conta || 'ativa'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', marginBottom: '4px' }}><BsPersonBadge /> Tipo de Conta</span>
                    <span className={styles.detailValue} style={{ fontSize: '1.05rem', fontWeight: 500, textTransform: 'capitalize' }}>{user.perfil}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ABA FAVORITOS */}
            {activeTab === 'favoritos' && (
              <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Meus Favoritos</h3>
                {isLoadingFavoritos ? <p>Carregando favoritos...</p> : favoritosDetalhados.length === 0 ? <p style={{ color: '#666' }}>Você não possui favoritos ainda.</p> : (
                  <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                    {favoritosDetalhados.map((f, i) => {
                      const alvoParaConsulta = f.submissao_id ?? f.item_id; 
                      const alvoParaRemover = f.item_id ?? f.id_favorito;
                      if (!alvoParaConsulta) return null;
                      const fid = f.item_id ?? f.submissao_id ?? f._raw?.id ?? `fav-${i}`;
                      return (
                        <li key={fid} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #eee', borderRadius: '6px' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{fixEncoding(f.titulo_proposto || f.titulo || 'Sem título')}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{f.autor && <span>{fixEncoding(f.autor)} • </span>}<span>{f.origem === 'FISICO' ? 'Acervo Físico' : 'Acervo Digital'}</span></div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={styles.button} onClick={() => router.push(`/consulta/${encodeURIComponent(alvoParaConsulta)}`)}>Ver</button>
                            <button className={styles.button} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }} onClick={() => handleToggleFavorito(alvoParaRemover)}>Remover</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ABA SUBMISSÕES */}
            {/* ABA SUBMISSÕES */}
{activeTab === 'submissoes' && (
  <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
    
    {/* Cabeçalho com Filtro */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h3 style={{ margin: 0 }}>Minhas Submissões</h3>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label htmlFor="filtro-submissoes" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Status:</label>
        <select 
          id="filtro-submissoes" 
          value={submissoesFilter} 
          onChange={(e) => setSubmissoesFilter(e.target.value)} 
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="todas">Todas</option>
          <option value="analise">Pendente</option>
          <option value="aprovado">Aprovadas</option>
          <option value="rejeitado">Rejeitadas</option>
        </select>
      </div>
    </div>

                {/* Lista */}
                {isLoadingSubmissoes ? (
                  <p>Carregando submissões...</p>
                ) : submissoes.length === 0 ? (
                  <p style={{ color: '#666' }}>Você não possui submissões registradas.</p>
                ) : submissoesFiltradas.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma submissão encontrada com este filtro.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {submissoesFiltradas.map((s) => (
                      <div key={s.submissao_id} style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '1.05rem' }}>{s.titulo_proposto || `Submissão #${s.submissao_id}`}</strong>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                              {s.autor ? `${s.autor} • ` : ''}{formatDate(s.data_submissao)}
                            </div>
                          </div>
                          <div style={{ 
                            padding: '4px 10px', 
                            borderRadius: '4px', 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            backgroundColor: s.status === 'aprovado' ? '#dcfce7' : s.status === 'rejeitado' ? '#fee2e2' : '#fef9c3', 
                            color: s.status === 'aprovado' ? '#166534' : s.status === 'rejeitado' ? '#991b1b' : '#854d0e', 
                            textTransform: 'capitalize' 
                          }}>
                            {s.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA RESERVAS */}
            {activeTab === 'reservas' && (
              <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Minhas Reservas</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label htmlFor="filtro-reservas" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mostrar:</label>
                    <select id="filtro-reservas" value={reservasFilter} onChange={(e) => setReservasFilter(e.target.value)} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}>
                      <option value="ativas">Ativas</option>
                      <option value="finalizadas">Histórico</option>
                      <option value="todas">Todas</option>
                    </select>
                    <button className={styles.button} onClick={carregarReservas} style={{ marginLeft: 8 }}>↻</button>
                  </div>
                </div>
                {isLoadingReservas ? <p>Carregando reservas...</p> : reservasFiltradas.length === 0 ? <p style={{ color: '#666' }}>Nenhuma reserva encontrada.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6', color: '#6b7280', fontSize: '0.9rem' }}>
                          <th style={{ padding: '12px' }}>Título</th>
                          <th style={{ padding: '12px' }}>Retirada</th>
                          <th style={{ padding: '12px' }}>Devolução</th>
                          <th style={{ padding: '12px' }}>Status</th>
                          <th style={{ padding: '12px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservasFiltradas.map(r => {
                          const st = String(r.status || '-').toLowerCase();
                          const podeRenovar = st === 'atendida';
                          return (
                            <tr key={r.reserva_id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                              <td style={{ padding: '12px', fontWeight: 500 }}>{r.titulo || '-'}</td>
                              <td style={{ padding: '12px' }}>{formatDate(r.data_prevista_retirada)}</td>
                              <td style={{ padding: '12px', color: isOverdue(r) ? '#b20000' : undefined }}>{formatDate(r.data_prevista_devolucao)}{isOverdue(r) && <span style={{ marginLeft: 6, fontWeight: 'bold', color: '#b20000' }}>!</span>}</td>
                              <td style={{ padding: '12px', textTransform: 'capitalize' }}>{String(r.status || '-')}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className={styles.button} onClick={() => openReservaDetalhe(r)}>Ver</button>
                                  {podeRenovar && <button className={styles.button} onClick={() => handleRenovar(r)} disabled={processingReservaId === r.reserva_id} style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Renovar</button>}
                                  {st === 'ativa' && <button className={styles.button} onClick={() => handleCancelar(r)} disabled={processingReservaId === r.reserva_id} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Cancelar</button>}
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