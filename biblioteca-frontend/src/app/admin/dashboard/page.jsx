// app/admin/dashboard/page.jsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from './dashboard-admin.module.css';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';

/**
 * Dashboard admin completo e autocontido.
 * - Mantém todas as funcionalidades de CRUD de usuários e solicitações.
 * - Substitui a dependência externa de um componente de estatísticas por um componente inline (DashboardStatsInline)
 * usando SVG pies — evita erros de build por falta de arquivo / dependências externas.
 */

/* ============================
   Helper: SVG Pie (donut) component
   ============================ */
function DonutChart({ data = [], colors = [], size = 160, thickness = 18, showLegend = true }) {
  // data: array of { label, value }
  const total = data.reduce((s, it) => s + Math.max(0, Number(it.value || 0)), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* background ring */}
          <circle
            r={radius}
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const value = Math.max(0, Number(d.value || 0));
            const pct = total === 0 ? 0 : value / total;
            const dash = pct * circumference;
            const gap = Math.max(0, circumference - dash);
            const offset = -cumulative * circumference;
            cumulative += pct;
            const stroke = colors[i] || ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'][i % 4];

            return (
              <circle
                key={d.label + i}
                r={radius}
                fill="transparent"
                stroke={stroke}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform="rotate(-90)"
                style={{ transition: 'stroke-dasharray 400ms, stroke-dashoffset 400ms' }}
              />
            );
          })}
        </g>
        {/* center text */}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: '#374151' }}>
          {total}
        </text>
      </svg>

      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => {
            const pct = total === 0 ? 0 : Math.round((Number(d.value || 0) / total) * 100);
            const stroke = colors[i] || ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'][i % 4];
            return (
              <div key={d.label + i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#333' }}>
                <span style={{ width: 12, height: 12, background: stroke, borderRadius: 3, display: 'inline-block' }} />
                <span style={{ minWidth: 120 }}>{d.label}</span>
                <span style={{ color: '#6b7280' }}>{d.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================
   DashboardStatsInline
   - Busca dados de /api/admin/stats/usuarios, /api/admin/stats/reservas e /api/acervo/stats.
   - Renderiza 3 DonutChart: usuários, reservas e acervo.
   ============================ */
function DashboardStatsInline({ apiBaseUrl = 'http://localhost:4000' }) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchJson = async (url) => {
      try {
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    const load = async () => {
      setLoading(true);
      setErr('');

      // 1) Tentamos endpoints específicos (como o backend foi ajustado)
      const [users, acervo, reservations] = await Promise.all([
        fetchJson(`${apiBaseUrl}/api/admin/stats/usuarios`), // Endpoint configurado
        fetchJson(`${apiBaseUrl}/api/acervo/stats`), // Rota pública de acervo
        fetchJson(`${apiBaseUrl}/api/admin/stats/reservas`), // NOVO Endpoint de reservas
      ]);
      
      const consolidated = {
        users: users,
        acervo: acervo, // Deve retornar { totalTitulos, itensDigitais, livrosFisicos }
        reservations: reservations, // Deve retornar { total, ativas, pendentes, concluidas, canceladas }
      };

      if (mounted) setRaw(consolidated);
      if (mounted) setLoading(false);
      
      if (!users && !acervo && !reservations && mounted) {
        setErr('Não foi possível carregar nenhuma estatística. Verifique o servidor.');
      }
    };

    load();
    return () => { mounted = false; };
  }, [apiBaseUrl]);

  const userCounts = useMemo(() => {
    const u = raw?.users || {};
    const ativos = Number(u.ativos ?? u.active ?? 0) || 0;
    const inativos = Number(u.inativos ?? u.inactive ?? 0) || 0;
    const bloqueados = Number(u.bloqueados ?? u.blocked ?? 0) || 0;
    const total = ativos + inativos + bloqueados;
    return { ativos, inativos, bloqueados, total };
  }, [raw]);

  const acervoCounts = useMemo(() => {
    // Usamos os campos que configuramos na rota de acervo
    const a = raw?.acervo || {}; 
    const livros = Number(a.livrosFisicos ?? 0) || 0;
    const digitais = Number(a.itensDigitais ?? 0) || 0;
    const total = Number(a.totalTitulos ?? 0) || (livros + digitais);
    // Removemos 'outros' pois o backend de acervo não retorna mais
    return { livros, digitais, outros: 0, total }; 
  }, [raw]);
  
  const reservationCounts = useMemo(() => {
    const r = raw?.reservations || {};
    const ativas = Number(r.ativas ?? 0) || 0;
    const pendentes = Number(r.pendentes ?? 0) || 0;
    const concluidas = Number(r.concluidas ?? 0) || 0;
    const canceladas = Number(r.canceladas ?? 0) || 0;
    const total = Number(r.total ?? 0) || (ativas + pendentes + concluidas + canceladas);
    return { ativas, pendentes, concluidas, canceladas, total };
  }, [raw]);

  if (loading) return <div style={{ padding: 12 }}>Carregando estatísticas...</div>;
  if (err) return <div style={{ color: '#b91c1c', padding: 12 }}>{err}</div>;
  
  // Verifica se temos dados úteis
  const hasReservationData = reservationCounts.total > 0;
  const hasUserData = userCounts.total > 0;
  const hasAcervoData = acervoCounts.total > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        
        {/* GRÁFICO DE USUÁRIOS */}
        {hasUserData && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Usuários</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[
                  { label: 'Ativos', value: userCounts.ativos },
                  { label: 'Inativos', value: userCounts.inativos },
                  { label: 'Bloqueados', value: userCounts.bloqueados },
                ]}
                colors={['#10b981', '#6366f1', '#ef4444']}
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className={styles.smallStatCard}>Total: <strong>{userCounts.total}</strong></div>
                <div className={styles.smallStatCard}>Ativos: <strong>{userCounts.ativos}</strong></div>
                <div className={styles.smallStatCard}>Bloqueados: <strong>{userCounts.bloqueados}</strong></div>
              </div>
            </div>
          </div>
        )}
        
        {/* GRÁFICO DE RESERVAS (NOVO) */}
        {hasReservationData && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Reservas</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[
                  { label: 'Ativas', value: reservationCounts.ativas },
                  { label: 'Pendentes', value: reservationCounts.pendentes },
                  { label: 'Concluídas', value: reservationCounts.concluidas },
                  { label: 'Canceladas', value: reservationCounts.canceladas },
                ]}
                colors={['#3b82f6', '#f59e0b', '#10b981', '#ef4444']} // Azul, Amarelo, Verde, Vermelho
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className={styles.smallStatCard}>Total: <strong>{reservationCounts.total}</strong></div>
                <div className={styles.smallStatCard}>Ativas: <strong>{reservationCounts.ativas}</strong></div>
                <div className={styles.smallStatCard}>Pendentes: <strong>{reservationCounts.pendentes}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* GRÁFICO DE ACERVO */}
        {hasAcervoData && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Acervo (Títulos)</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[
                  { label: 'Livros Físicos', value: acervoCounts.livros },
                  { label: 'Itens Digitais', value: acervoCounts.digitais },
                  // { label: 'Outros', value: acervoCounts.outros }, // Removido
                ]}
                colors={['#3b82f6', '#f59e0b', '#6b7280']}
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className={styles.smallStatCard}>Total: <strong>{acervoCounts.total}</strong></div>
                <div className={styles.smallStatCard}>Digitais: <strong>{acervoCounts.digitais}</strong></div>
                <div className={styles.smallStatCard}>Livros Físicos: <strong>{acervoCounts.livros}</strong></div>
              </div>
            </div>
          </div>
        )}
        
        {!hasUserData && !hasReservationData && !hasAcervoData && (
            <div style={{ flex: '1 1 100%', color: '#6b7280', padding: '10px 0' }}>Nenhum dado de estatística disponível para renderização.</div>
        )}

      </div>

      {/* Cartões de resumo na parte inferior */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        {hasAcervoData && <div className={styles.smallStatCard}>Títulos Totais: <strong>{acervoCounts.total}</strong></div>}
        {hasReservationData && <div className={styles.smallStatCard}>Reservas Ativas: <strong>{reservationCounts.ativas}</strong></div>}
        {hasReservationData && <div className={styles.smallStatCard}>Reservas Pendentes: <strong>{reservationCounts.pendentes}</strong></div>}
        {hasUserData && <div className={styles.smallStatCard}>Usuários Ativos: <strong>{userCounts.ativos}</strong></div>}
      </div>
    </div>
  );
}

/* ============================
   AdminDashboardPage (principal)
   ============================ */
export default function AdminDashboardPage() {
  // ---------- CONFIG ----------
  const router = useRouter();
  const { logout } = useGlobalMenu();
  // Usa NEXT_PUBLIC_API_URL, o que é correto para o frontend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'; 

  // ---------- STATES ----------
  const [users, setUsers] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingSolicitacoes, setIsLoadingSolicitacoes] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Popup criação/edição
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const initialFormState = { nome: '', email: '', ra: '', senha: '', confirmarSenha: '', perfil: 'comum', status_conta: 'ativa' };
  const [createFormData, setCreateFormData] = useState(initialFormState);
  const createPopupRef = useRef(null);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState(initialFormState);
  const editPopupRef = useRef(null);

  // Pesquisas por perfil
  const [searchTermAlunos, setSearchTermAlunos] = useState('');
  const [searchTermProfessores, setSearchTermProfessores] = useState('');
  const [searchTermBibliotecarios, setSearchTermBibliotecarios] = useState('');
  const [searchTermAdmins, setSearchTermAdmins] = useState('');

  // Abas
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'solicitacoes' | 'estatisticas'

  // ---------- FETCHS ----------
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/usuarios`, { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : (data?.usuarios ?? []));
    } catch (err) {
      console.error("Erro fetchUsers:", err);
      setError('Falha ao carregar lista de usuários.');
      if (String(err?.message || '').includes('401') || String(err?.message || '').includes('403')) {
        setTimeout(() => router.push('/login'), 1500);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSolicitacoes = async () => {
    setIsLoadingSolicitacoes(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/solicitacoes`, { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSolicitacoes(Array.isArray(data) ? data : (data?.solicitacoes ?? []));
    } catch (err) {
      console.error("Erro fetchSolicitacoes:", err);
      setError('Falha ao carregar lista de solicitações pendentes.');
      if (String(err?.message || '').includes('401') || String(err?.message || '').includes('403')) {
        setTimeout(() => router.push('/login'), 1500);
      }
    } finally {
      setIsLoadingSolicitacoes(false);
    }
  };

  // ---------- AUTH CHECK & INITIAL LOAD ----------
  useEffect(() => {
    document.title = 'Painel Admin | Biblioteca Fatec ZL';

    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/auth/current-user`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          router.push('/login');
          return false;
        }
        const user = await res.json();
        if (user.perfil !== 'admin' && user.perfil !== 'bibliotecario') {
          router.push('/dashboard');
          return false;
        }
        return true;
      } catch (err) {
        console.error("Erro no checkAuth:", err);
        router.push('/login');
        return false;
      }
    };

    checkAuth().then(isAuthorized => {
      if (isAuthorized) {
        fetchUsers();
        fetchSolicitacoes();
      } else {
        setIsLoadingUsers(false);
        setIsLoadingSolicitacoes(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ---------- EDIT / CREATE HANDLERS ----------
  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({ ...user });
    setShowEditPopup(true);
    setError('');
    setMessage('');
    setTimeout(() => editPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleCancelEdit = () => {
    setShowEditPopup(false);
    setEditingUser(null);
    setEditFormData(initialFormState);
    setError('');
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    setIsActionLoading(true);
    setMessage('');
    setError('');
    const userId = editingUser.usuario_id;
    const dataToUpdate = {
      nome: editFormData.nome,
      email: editFormData.email,
      ra: editFormData.perfil === 'comum' ? (editFormData.ra || null) : null,
      perfil: editFormData.perfil,
      status_conta: editFormData.status_conta,
    };

    try {
      const response = await fetch(`${apiUrl}/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToUpdate)
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire({ title: 'Sucesso!', text: `Usuário ${dataToUpdate.nome} atualizado.`, icon: 'success', timer: 1500, showConfirmButton: false });
        handleCancelEdit();
        setUsers(prev => prev.map(u => u.usuario_id === userId ? { ...u, ...dataToUpdate } : u));
      } else {
        setError(data.message || 'Falha ao atualizar.');
      }
    } catch (err) {
      console.error("Erro de rede no update:", err);
      setError('Erro de rede ao atualizar.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (userId, userName) => {
    setError(''); setMessage('');
    const result = await Swal.fire({
      title: 'Deseja Excluir?',
      text: `Excluir "${userName}" (ID: ${userId})? Esta ação é irreversível!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/usuarios/${userId}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Usuário ${userId} excluído.`);
        setUsers(prev => prev.filter(u => u.usuario_id !== userId));
      } else {
        setError(data.message || `Falha ao excluir ${userId}.`);
      }
    } catch (err) {
      console.error("Erro de rede na exclusão:", err);
      setError('Erro de rede ao excluir.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------- SOLICITAÇÕES ----------
  const handleAprovar = async (solicitacaoId, email) => {
    setMessage(''); setError('');
    setIsActionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/solicitacoes/${solicitacaoId}/aprovar`, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Solicitação ${solicitacaoId} aprovada. E-mail enviado para ${email}.`);
        setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
        fetchUsers();
      } else {
        setError(data.message || `Falha ao aprovar ${solicitacaoId}.`);
      }
    } catch (err) {
      console.error("Erro aprovar:", err);
      setError('Erro de rede ao aprovar.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejeitar = async (solicitacaoId, email) => {
    setMessage(''); setError('');
    setIsActionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/solicitacoes/${solicitacaoId}/rejeitar`, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Solicitação ${solicitacaoId} rejeitada.`);
        setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
      } else {
        setError(data.message || `Falha ao rejeitar ${solicitacaoId}.`);
      }
    } catch (err) {
      console.error("Erro rejeitar:", err);
      setError('Erro de rede ao rejeitar.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------- CREATE ----------
  const handleCreateClick = () => {
    setCreateFormData(initialFormState);
    setShowCreatePopup(true);
    setError(''); setMessage('');
    setTimeout(() => { createPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  };

  const handleCancelCreate = () => {
    setShowCreatePopup(false);
    setCreateFormData(initialFormState);
    setError('');
  };

  const handleCreateFormChange = (event) => {
    const { name, value } = event.target;
    setCreateFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'perfil' && value !== 'comum') updated.ra = '';
      return updated;
    });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setIsActionLoading(true); setMessage(''); setError('');

    const dataToCreate = { ...createFormData, ra: createFormData.perfil === 'comum' ? createFormData.ra : null };
    delete dataToCreate.confirmarSenha;

    if (!dataToCreate.senha || dataToCreate.senha.length < 8) {
      setError('A senha é obrigatória e deve ter pelo menos 8 caracteres.');
      setIsActionLoading(false);
      return;
    }
    if (dataToCreate.perfil === 'comum' && (!dataToCreate.ra || dataToCreate.ra.length !== 13 || !/^\d+$/.test(dataToCreate.ra))) {
      setError('RA é obrigatório (13 dígitos numéricos) para o perfil Aluno.');
      setIsActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToCreate),
      });
      const data = await response.json();
      if (response.ok || response.status === 201) {
        setMessage(data.message || `Usuário criado com sucesso.`);
        handleCancelCreate();
        fetchUsers();
      } else {
        setError(data.message || 'Falha ao criar usuário.');
      }
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      setError('Erro de rede ao tentar criar usuário.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------- FILTROS ----------
  const filteredAlunos = useMemo(
    () => users.filter(user => user.perfil === 'comum' && (String(user.nome).toLowerCase().includes(searchTermAlunos.toLowerCase()) || String(user.email).toLowerCase().includes(searchTermAlunos.toLowerCase()) || (user.ra && user.ra.includes(searchTermAlunos)))),
    [users, searchTermAlunos]
  );
  const filteredProfessores = useMemo(
    () => users.filter(user => user.perfil === 'professor' && (String(user.nome).toLowerCase().includes(searchTermProfessores.toLowerCase()) || String(user.email).toLowerCase().includes(searchTermProfessores.toLowerCase()))),
    [users, searchTermProfessores]
  );
  const filteredBibliotecarios = useMemo(
    () => users.filter(user => user.perfil === 'bibliotecario' && (String(user.nome).toLowerCase().includes(searchTermBibliotecarios.toLowerCase()) || String(user.email).toLowerCase().includes(searchTermBibliotecarios.toLowerCase()))),
    [users, searchTermBibliotecarios]
  );
  const filteredAdmins = useMemo(
    () => users.filter(user => user.perfil === 'admin' && (String(user.nome).toLowerCase().includes(searchTermAdmins.toLowerCase()) || String(user.email).toLowerCase().includes(searchTermAdmins.toLowerCase()))),
    [users, searchTermAdmins]
  );

  const isPageLoading = isLoadingUsers || isLoadingSolicitacoes;

  // ---------- LOGOUT ----------
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // ---------- NAV BUTTON STYLE ----------
  const navButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: isActive ? '#b20000' : '#e5e7eb',
    backgroundColor: isActive ? '#b20000' : '#fff',
    color: isActive ? '#fff' : '#374151',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
  });

  // ---------- RENDER ----------
  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1>Painel Administrativo</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { setActiveTab('usuarios'); fetchUsers(); }} style={navButtonStyle(activeTab === 'usuarios')}>Usuários</button>
          <button onClick={() => { setActiveTab('solicitacoes'); fetchSolicitacoes(); }} style={navButtonStyle(activeTab === 'solicitacoes')}>Solicitações</button>
          <button onClick={() => setActiveTab('estatisticas')} style={navButtonStyle(activeTab === 'estatisticas')}>Estatísticas</button>
          <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`} style={{ backgroundColor: '#b20000', color: '#fff' }}>Sair</button>
        </div>
      </div>

      {/* mensagens gerais */}
      {!isPageLoading && error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
      {!isPageLoading && message && <p className={`${styles.message} ${styles.successText}`}>{message}</p>}

      {/* =========== ABA: USUÁRIOS =========== */}
      {activeTab === 'usuarios' && (
        <section className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className={styles.sectionTitle}>Gerenciar Usuários</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchUsers} className={styles.button} disabled={isPageLoading || isActionLoading}>{isLoadingUsers ? 'Carregando...' : 'Atualizar Listas'}</button>
              <button onClick={handleCreateClick} className={`${styles.button} ${styles.createButton}`} disabled={isPageLoading || isActionLoading}>Criar Novo Usuário</button>
            </div>
          </div>

          {isLoadingUsers && <p className={styles.loadingText}>Carregando Usuários...</p>}

          {!isLoadingUsers && (
            <>
              {/* ALUNOS */}
              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>Alunos (Comum)</h3>
                <div className={styles.searchContainer}>
                  <input type="text" placeholder="Pesquisar Aluno por nome, email ou RA..." value={searchTermAlunos} onChange={(e) => setSearchTermAlunos(e.target.value)} className={styles.searchInput} />
                </div>
                {filteredAlunos.length === 0 ? <p>Nenhum aluno encontrado.</p> : (
                  <table className={styles.table}>
                    <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>RA</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                      {filteredAlunos.map(user => (
                        <tr key={user.usuario_id}>
                          <td className={styles.td}>{user.usuario_id}</td>
                          <td className={styles.td}>{user.nome}</td>
                          <td className={styles.td}>{user.email}</td>
                          <td className={styles.td}>{user.ra}</td>
                          <td className={styles.td}>{user.status_conta}</td>
                          <td className={styles.td}>
                            <button onClick={() => handleEditClick(user)} className={`${styles.button} ${styles.editButton}`} disabled={isActionLoading}>Editar</button>
                            <button onClick={() => handleDelete(user.usuario_id, user.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={isActionLoading}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PROFESSORES */}
              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>Professores</h3>
                <div className={styles.searchContainer}>
                  <input type="text" placeholder="Pesquisar Professor por nome ou email..." value={searchTermProfessores} onChange={(e) => setSearchTermProfessores(e.target.value)} className={styles.searchInput} />
                </div>
                {filteredProfessores.length === 0 ? <p>Nenhum professor encontrado.</p> : (
                  <table className={styles.table}>
                    <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                      {filteredProfessores.map(user => (
                        <tr key={user.usuario_id}>
                          <td className={styles.td}>{user.usuario_id}</td>
                          <td className={styles.td}>{user.nome}</td>
                          <td className={styles.td}>{user.email}</td>
                          <td className={styles.td}>{user.status_conta}</td>
                          <td className={styles.td}>
                            <button onClick={() => handleEditClick(user)} className={`${styles.button} ${styles.editButton}`} disabled={isActionLoading}>Editar</button>
                            <button onClick={() => handleDelete(user.usuario_id, user.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={isActionLoading}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* BIBLIOTECÁRIOS */}
              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>Bibliotecários</h3>
                <div className={styles.searchContainer}>
                  <input type="text" placeholder="Pesquisar Bibliotecário por nome ou email..." value={searchTermBibliotecarios} onChange={(e) => setSearchTermBibliotecarios(e.target.value)} className={styles.searchInput} />
                </div>
                {filteredBibliotecarios.length === 0 ? <p>Nenhum bibliotecário encontrado.</p> : (
                  <table className={styles.table}>
                    <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                      {filteredBibliotecarios.map(user => (
                        <tr key={user.usuario_id}>
                          <td className={styles.td}>{user.usuario_id}</td>
                          <td className={styles.td}>{user.nome}</td>
                          <td className={styles.td}>{user.email}</td>
                          <td className={styles.td}>{user.status_conta}</td>
                          <td className={styles.td}>
                            <button onClick={() => handleEditClick(user)} className={`${styles.button} ${styles.editButton}`} disabled={isActionLoading}>Editar</button>
                            <button onClick={() => handleDelete(user.usuario_id, user.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={isActionLoading}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ADMINS */}
              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>Administradores</h3>
                <div className={styles.searchContainer}>
                  <input type="text" placeholder="Pesquisar Administrador por nome ou email..." value={searchTermAdmins} onChange={(e) => setSearchTermAdmins(e.target.value)} className={styles.searchInput} />
                </div>
                {filteredAdmins.length === 0 ? <p>Nenhum administrador encontrado.</p> : (
                  <table className={styles.table}>
                    <thead><tr><th>ID</th><th>Nome</th><th>Email</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                      {filteredAdmins.map(user => (
                        <tr key={user.usuario_id}>
                          <td className={styles.td}>{user.usuario_id}</td>
                          <td className={styles.td}>{user.nome}</td>
                          <td className={styles.td}>{user.email}</td>
                          <td className={styles.td}>{user.status_conta}</td>
                          <td className={styles.td}>
                            <button onClick={() => handleEditClick(user)} className={`${styles.button} ${styles.editButton}`} disabled={isActionLoading}>Editar</button>
                            <button onClick={() => handleDelete(user.usuario_id, user.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={isActionLoading}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* =========== SOLICITAÇÕES =========== */}
      {activeTab === 'solicitacoes' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Solicitações Pendentes</h2>
          {isLoadingSolicitacoes ? <p className={styles.loadingText}>A carregar solicitações...</p> : null}
          {!isLoadingSolicitacoes && solicitacoes.length === 0 && <p>Nenhuma solicitação pendente.</p>}
          {!isLoadingSolicitacoes && solicitacoes.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr><th>ID</th><th>Nome</th><th>Email</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {solicitacoes.map(sol => (
                  <tr key={sol.solicitacao_id}>
                    <td className={styles.td}>{sol.solicitacao_id}</td>
                    <td className={styles.td}>{sol.nome}</td>
                    <td className={styles.td}>{sol.email}</td>
                    <td className={styles.td}>
                      <button onClick={() => handleAprovar(sol.solicitacao_id, sol.email)} className={`${styles.button} ${styles.approveButton}`} disabled={isActionLoading}>Aprovar</button>
                      <button onClick={() => handleRejeitar(sol.solicitacao_id, sol.email)} className={`${styles.button} ${styles.rejectButton}`} disabled={isActionLoading}>Rejeitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* =========== ESTATÍSTICAS (AJUSTADO) =========== */}
      {activeTab === 'estatisticas' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Estatísticas do Sistema</h2>
          <div style={{ background: '#fff', padding: 18, borderRadius: 8, border: '1px solid #eee' }}>
            <DashboardStatsInline apiBaseUrl={apiUrl} />
          </div>
        </section>
      )}

      {/* =========== POPUP: CRIAR =========== */}
      {showCreatePopup && (
        <div className={styles.popupOverlay} ref={createPopupRef}>
          <div className={styles.popupContent}>
            <h2>Criar um novo usuário</h2>
            {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="create-nome" className={styles.formLabel}>Nome:</label>
                <input id="create-nome" name="nome" value={createFormData.nome} onChange={handleCreateFormChange} className={styles.formInput} required />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="create-email" className={styles.formLabel}>Email:</label>
                <input id="create-email" type="email" name="email" value={createFormData.email} onChange={handleCreateFormChange} className={styles.formInput} required />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="create-senha" className={styles.formLabel}>Senha:</label>
                <input id="create-senha" type="password" name="senha" value={createFormData.senha} onChange={handleCreateFormChange} className={styles.formInput} minLength={8} required />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="create-perfil" className={styles.formLabel}>Perfil:</label>
                <select id="create-perfil" name="perfil" value={createFormData.perfil} onChange={handleCreateFormChange} className={styles.formSelect} required>
                  <option value="comum">Comum (Aluno)</option>
                  <option value="professor">Professor</option>
                  <option value="bibliotecario">Bibliotecário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formRow} style={{ display: createFormData.perfil === 'comum' ? 'flex' : 'none' }}>
                <label htmlFor="create-ra" className={styles.formLabel}>RA:</label>
                <input id="create-ra" name="ra" value={createFormData.ra} onChange={handleCreateFormChange} maxLength={13} className={styles.formInput} placeholder="(Obrigatório se Aluno)" />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>{isActionLoading ? 'Criando...' : 'Criar Usuário'}</button>
                <button type="button" onClick={handleCancelCreate} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========== POPUP: EDITAR =========== */}
      {showEditPopup && editingUser && (
        <div className={styles.popupOverlay} ref={editPopupRef}>
          <div className={styles.popupContent}>
            <h2>Editar Usuário (ID: {editingUser.usuario_id})</h2>
            {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="edit-nome" className={styles.formLabel}>Nome:</label>
                <input id="edit-nome" name="nome" value={editFormData.nome || ''} onChange={handleEditFormChange} className={styles.formInput} required />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="edit-email" className={styles.formLabel}>Email:</label>
                <input id="edit-email" type="email" name="email" value={editFormData.email || ''} onChange={handleEditFormChange} className={styles.formInput} required />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="edit-perfil" className={styles.formLabel}>Perfil:</label>
                <select id="edit-perfil" name="perfil" value={editFormData.perfil || 'comum'} onChange={handleEditFormChange} className={styles.formSelect} required>
                  <option value="comum">Comum (Aluno)</option>
                  <option value="professor">Professor</option>
                  <option value="bibliotecario">Bibliotecário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formRow} style={{ display: editFormData.perfil === 'comum' ? 'flex' : 'none' }}>
                <label htmlFor="edit-ra" className={styles.formLabel}>RA:</label>
                <input id="edit-ra" name="ra" value={editFormData.ra || ''} onChange={handleEditFormChange} maxLength={13} className={styles.formInput} placeholder="(Obrigatório se Aluno)" />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="edit-status" className={styles.formLabel}>Status:</label>
                <select id="edit-status" name="status_conta" value={editFormData.status_conta || 'ativa'} onChange={handleEditFormChange} className={styles.formSelect} required>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>{isActionLoading ? 'Salvando...' : 'Salvar Alterações'}</button>
                <button type="button" onClick={handleCancelEdit} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}