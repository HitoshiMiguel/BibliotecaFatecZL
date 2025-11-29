// app/admin/dashboard/page.jsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from './dashboard-admin.module.css';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';
import { FaFilePdf } from 'react-icons/fa';
import { generateAdminReport } from '@/components/reportGenerator';

/* ============================
   1. HELPER: SVG Pie (donut) component
   (Mantido da sua versão nova para não depender de libs externas)
   ============================ */
function DonutChart({ data = [], colors = [], size = 160, thickness = 18, showLegend = true }) {
  const total = data.reduce((s, it) => s + Math.max(0, Number(it.value || 0)), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={thickness} />
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
                key={d.label + i} r={radius} fill="transparent" stroke={stroke} strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="butt"
                transform="rotate(-90)" style={{ transition: 'stroke-dasharray 400ms, stroke-dashoffset 400ms' }}
              />
            );
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: '#374151' }}>{total}</text>
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
   2. HELPER: DashboardStatsInline
   ============================ */
/* ============================
   2. HELPER: DashboardStatsInline (ATUALIZADO)
   ============================ */
function DashboardStatsInline({ apiBaseUrl = 'http://localhost:4000', adminUser }) {
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
      } catch (e) { return null; }
    };

    const load = async () => {
      setLoading(true); setErr('');
      const [users, acervo, reservations] = await Promise.all([
        fetchJson(`${apiBaseUrl}/api/admin/stats/usuarios`),
        fetchJson(`${apiBaseUrl}/api/acervo/stats`),
        fetchJson(`${apiBaseUrl}/api/admin/stats/reservas`),
      ]);
      
      if (mounted) {
          // Normaliza os dados para garantir estrutura correta pro PDF
          const cleanUsers = users || { ativos: 0, inativos: 0, bloqueados: 0 };
          const cleanAcervo = acervo || { livrosFisicos: 0, itensDigitais: 0 };
          const cleanReservations = reservations || { ativas: 0, pendentes: 0, concluidas: 0, canceladas: 0 };

          setRaw({ users: cleanUsers, acervo: cleanAcervo, reservations: cleanReservations });
          setLoading(false);
          if (!users && !acervo && !reservations) setErr('Não foi possível carregar nenhuma estatística.');
      }
    };
    load();
    return () => { mounted = false; };
  }, [apiBaseUrl]);

  // Handler do PDF
  const handleDownload = () => {
    if (!raw) return;
    const adminName = adminUser?.nome || 'Admin';
    generateAdminReport(raw, adminName);
  };

  // ... (cálculos useMemo mantidos iguais) ...
  const userCounts = useMemo(() => {
    const u = raw?.users || {};
    const ativos = Number(u.ativos ?? u.active ?? 0) || 0;
    const inativos = Number(u.inativos ?? u.inactive ?? 0) || 0;
    const bloqueados = Number(u.bloqueados ?? u.blocked ?? 0) || 0;
    return { ativos, inativos, bloqueados, total: ativos + inativos + bloqueados };
  }, [raw]);

  const acervoCounts = useMemo(() => {
    const a = raw?.acervo || {}; 
    const livros = Number(a.livrosFisicos ?? 0) || 0;
    const digitais = Number(a.itensDigitais ?? 0) || 0;
    return { livros, digitais, total: Number(a.totalTitulos ?? 0) || (livros + digitais) }; 
  }, [raw]);
  
  const reservationCounts = useMemo(() => {
    const r = raw?.reservations || {};
    const ativas = Number(r.ativas ?? 0) || 0;
    const pendentes = Number(r.pendentes ?? 0) || 0;
    const concluidas = Number(r.concluidas ?? 0) || 0;
    const canceladas = Number(r.canceladas ?? 0) || 0;
    return { ativas, pendentes, concluidas, canceladas, total: Number(r.total ?? 0) || (ativas + pendentes + concluidas + canceladas) };
  }, [raw]);

  if (loading) return <div style={{ padding: 12 }}>Carregando estatísticas...</div>;
  if (err) return <div style={{ color: '#b91c1c', padding: 12 }}>{err}</div>;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      
      {/* BOTÃO DE DOWNLOAD (NOVO) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button 
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#dc2626', color: 'white',
            padding: '8px 16px', border: 'none', borderRadius: '6px',
            fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
          }}
        >
          <FaFilePdf /> Gerar Relatório Gerencial
        </button>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* ... (Seus gráficos continuam iguais aqui) ... */}
        {/* Usuários */}
        {(userCounts.total > 0) && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Usuários</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[{ label: 'Ativos', value: userCounts.ativos }, { label: 'Inativos', value: userCounts.inativos }, { label: 'Bloqueados', value: userCounts.bloqueados }]}
                colors={['#10b981', '#6366f1', '#ef4444']}
              />
            </div>
          </div>
        )}
        {/* Reservas */}
        {(reservationCounts.total > 0) && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Reservas</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[{ label: 'Ativas', value: reservationCounts.ativas }, { label: 'Pendentes', value: reservationCounts.pendentes }, { label: 'Concluídas', value: reservationCounts.concluidas }, { label: 'Canceladas', value: reservationCounts.canceladas }]}
                colors={['#3b82f6', '#f59e0b', '#10b981', '#ef4444']}
              />
            </div>
          </div>
        )}
        {/* Acervo */}
        {(acervoCounts.total > 0) && (
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Acervo</h4>
            <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #eee' }}>
              <DonutChart
                data={[{ label: 'Livros Físicos', value: acervoCounts.livros }, { label: 'Itens Digitais', value: acervoCounts.digitais }]}
                colors={['#3b82f6', '#f59e0b']}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================
   3. COMPONENTE PRINCIPAL
   ============================ */
export default function AdminDashboardPage() {
    // ========================================================================
    // A. HOOKS NO TOPO (Regra de Ouro)
    // ========================================================================
    
    const { user, isAuthed, isLoading, logout } = useGlobalMenu();
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'; // API Base sem /api extra se possível, ajuste conforme sua config

    // Estados de Dados
    const [users, setUsers] = useState([]);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingSolicitacoes, setIsLoadingSolicitacoes] = useState(true);
    
    // Estados de UI
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'solicitacoes' | 'estatisticas'

    // Estados Popup Criação
    const initialFormState = { nome: '', email: '', ra: '', senha: '', confirmarSenha: '', perfil: 'comum', status_conta: 'ativa' };
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [createFormData, setCreateFormData] = useState(initialFormState);
    const createPopupRef = useRef(null);

    // Estados Popup Edição
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState(initialFormState);
    const editPopupRef = useRef(null);

    // Estados de Pesquisa
    const [searchTermAlunos, setSearchTermAlunos] = useState('');
    const [searchTermProfessores, setSearchTermProfessores] = useState('');
    const [searchTermBibliotecarios, setSearchTermBibliotecarios] = useState('');
    const [searchTermAdmins, setSearchTermAdmins] = useState('');

    // ========================================================================
    // B. USE MEMOS (Filtros)
    // ========================================================================
    
    const filteredAlunos = useMemo(() => users.filter(u => u.perfil === 'comum' && (u.nome.toLowerCase().includes(searchTermAlunos.toLowerCase()) || u.email.toLowerCase().includes(searchTermAlunos.toLowerCase()) || (u.ra && u.ra.includes(searchTermAlunos)))), [users, searchTermAlunos]);
    const filteredProfessores = useMemo(() => users.filter(u => u.perfil === 'professor' && (u.nome.toLowerCase().includes(searchTermProfessores.toLowerCase()) || u.email.toLowerCase().includes(searchTermProfessores.toLowerCase()))), [users, searchTermProfessores]);
    const filteredBibliotecarios = useMemo(() => users.filter(u => u.perfil === 'bibliotecario' && (u.nome.toLowerCase().includes(searchTermBibliotecarios.toLowerCase()) || u.email.toLowerCase().includes(searchTermBibliotecarios.toLowerCase()))), [users, searchTermBibliotecarios]);
    const filteredAdmins = useMemo(() => users.filter(u => u.perfil === 'admin' && (u.nome.toLowerCase().includes(searchTermAdmins.toLowerCase()) || u.email.toLowerCase().includes(searchTermAdmins.toLowerCase()))), [users, searchTermAdmins]);

    // ========================================================================
    // C. FUNÇÕES (Handlers & Fetchs)
    // ========================================================================

    const fetchUsers = async () => {
        setIsLoadingUsers(true); setError('');
        try {
            const response = await fetch(`${apiUrl}/api/admin/usuarios`, { method: 'GET', credentials: 'include', cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setUsers(Array.isArray(data) ? data : (data?.usuarios ?? []));
        } catch (err) {
            console.error("Erro fetchUsers:", err); 
            setError('Falha ao carregar lista de usuários.');
        } finally { setIsLoadingUsers(false); }
    };

    const fetchSolicitacoes = async () => {
        setIsLoadingSolicitacoes(true); setError('');
        try {
            const response = await fetch(`${apiUrl}/api/admin/solicitacoes`, { method: 'GET', credentials: 'include', cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSolicitacoes(Array.isArray(data) ? data : (data?.solicitacoes ?? []));
        } catch (err) {
            console.error("Erro fetchSolicitacoes:", err); 
            setError('Falha ao carregar solicitações.');
        } finally { setIsLoadingSolicitacoes(false); }
    };

    // Efeito de Segurança
    useEffect(() => {
        if (isLoading) return;
        if (!isAuthed) { router.push('/login'); return; }
        if (user?.role !== 'admin') { router.replace('/dashboard'); }
    }, [isAuthed, user, isLoading, router]);

    // Efeito de Carga Inicial
    useEffect(() => {
        if (isLoading || !isAuthed || user?.role !== 'admin') return;
        document.title = 'Painel Admin | Biblioteca Fatec ZL';
        // Carregamento inicial
        if (activeTab === 'usuarios') fetchUsers();
        if (activeTab === 'solicitacoes') fetchSolicitacoes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, isAuthed, user]); // Executa quando estabiliza

    // --- HANDLERS ---
    const handleLogout = async () => { await logout(); router.push('/login'); };

    const handleAprovar = async (solicitacaoId, email) => {
        setMessage(''); setError(''); setIsActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/admin/solicitacoes/${solicitacaoId}/aprovar`, { method: 'POST', credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setMessage(`Solicitação ${solicitacaoId} aprovada!`);
                setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
                fetchUsers();
            } else { setError(data.message || `Falha ao aprovar.`); }
        } catch (err) { setError('Erro de rede ao aprovar.'); } finally { setIsActionLoading(false); }
    };

    const handleRejeitar = async (solicitacaoId, email) => {
        setMessage(''); setError(''); setIsActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/admin/solicitacoes/${solicitacaoId}/rejeitar`, { method: 'POST', credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setMessage(`Solicitação ${solicitacaoId} rejeitada.`);
                setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
            } else { setError(data.message || `Falha ao rejeitar.`); }
        } catch (err) { setError('Erro de rede ao rejeitar.'); } finally { setIsActionLoading(false); }
    };

    const handleDelete = async (userId, userName) => {
        setError(''); setMessage('');
        const result = await Swal.fire({
            title: 'Deseja Excluir?', text: `Excluir "${userName}" (ID: ${userId})?`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir!'
        });
        if (result.isConfirmed) {
            setIsActionLoading(true);
            try {
                const response = await fetch(`${apiUrl}/api/admin/usuarios/${userId}`, { method: 'DELETE', credentials: 'include' });
                if (response.ok) {
                    setMessage(`Usuário ${userId} excluído.`);
                    setUsers(prev => prev.filter(u => u.usuario_id !== userId));
                } else { setError((await response.json()).message || `Falha ao excluir.`); }
            } catch (err) { setError('Erro de rede ao excluir.'); } finally { setIsActionLoading(false); }
        }
    };

    // Handlers de Popup
    const handleCreateClick = () => { setCreateFormData(initialFormState); setShowCreatePopup(true); setError(''); setMessage(''); setTimeout(() => createPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); };
    const handleCancelCreate = () => { setShowCreatePopup(false); setCreateFormData(initialFormState); setError(''); };
    const handleCreateFormChange = (e) => { const { name, value } = e.target; setCreateFormData(prev => ({ ...prev, [name]: value })); if(name === 'perfil' && value !== 'comum') setCreateFormData(prev => ({...prev, ra: ''})); };
    const handleCreateSubmit = async (e) => {
        e.preventDefault(); setIsActionLoading(true); setMessage(''); setError('');
        const dataToCreate = { ...createFormData, ra: createFormData.perfil === 'comum' ? createFormData.ra : null };
        delete dataToCreate.confirmarSenha;
        if (!dataToCreate.senha || dataToCreate.senha.length < 8) { setError('Senha mínima de 8 caracteres.'); setIsActionLoading(false); return; }
        try {
            const response = await fetch(`${apiUrl}/api/admin/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dataToCreate) });
            const data = await response.json();
            if (response.ok || response.status === 201) { setMessage(data.message || 'Criado.'); handleCancelCreate(); fetchUsers(); } else { setError(data.message || 'Falha.'); }
        } catch { setError('Erro de rede.'); } finally { setIsActionLoading(false); }
    };

    const handleEditClick = (u) => { setEditingUser(u); setEditFormData({...u}); setShowEditPopup(true); setError(''); setMessage(''); setTimeout(() => editPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); };
    const handleCancelEdit = () => { setShowEditPopup(false); setEditingUser(null); setEditFormData(initialFormState); setError(''); };
    const handleEditFormChange = (e) => { const { name, value } = e.target; setEditFormData(prev => ({ ...prev, [name]: value })); };
    const handleUpdateSubmit = async (e) => {
        e.preventDefault(); setIsActionLoading(true); setMessage(''); setError('');
        const userId = editingUser.usuario_id;
        const dataToUpdate = { nome: editFormData.nome, email: editFormData.email, ra: editFormData.perfil === 'comum' ? (editFormData.ra || null) : null, perfil: editFormData.perfil, status_conta: editFormData.status_conta };
        try {
            const response = await fetch(`${apiUrl}/api/admin/usuarios/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dataToUpdate) });
            const data = await response.json();
            if (response.ok) { Swal.fire({ title: 'Sucesso!', text: 'Atualizado.', icon: 'success', timer: 1500, showConfirmButton: false }); handleCancelEdit(); setUsers(prev => prev.map(u => u.usuario_id === userId ? { ...editingUser, ...dataToUpdate } : u)); } else { setError(data.message || 'Falha.'); }
        } catch { setError('Erro de rede.'); } finally { setIsActionLoading(false); }
    };

    // Nav Button Style
    const navButtonStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '6px',
        border: '1px solid', borderColor: isActive ? '#b20000' : '#e5e7eb',
        backgroundColor: isActive ? '#b20000' : '#fff', color: isActive ? '#fff' : '#374151',
        fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer',
    });

    // ========================================================================
    // D. RENDERIZAÇÃO
    // ========================================================================

    if (isLoading) return <div className={styles.loadingText}>Verificando permissões...</div>;
    if (!isAuthed || user?.role !== 'admin') return null;

    const isPageLoading = isLoadingUsers || isLoadingSolicitacoes;

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

            {!isPageLoading && error && !showEditPopup && !showCreatePopup && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
            {!isPageLoading && message && !showEditPopup && !showCreatePopup && <p className={`${styles.message} ${styles.successText}`}>{message}</p>}

            {/* ABA USUÁRIOS */}
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
                            <SubTable title="Alunos (Comum)" data={filteredAlunos} term={searchTermAlunos} setTerm={setSearchTermAlunos} onEdit={handleEditClick} onDelete={handleDelete} loading={isActionLoading} />
                            <SubTable title="Professores" data={filteredProfessores} term={searchTermProfessores} setTerm={setSearchTermProfessores} onEdit={handleEditClick} onDelete={handleDelete} loading={isActionLoading} />
                            <SubTable title="Bibliotecários" data={filteredBibliotecarios} term={searchTermBibliotecarios} setTerm={setSearchTermBibliotecarios} onEdit={handleEditClick} onDelete={handleDelete} loading={isActionLoading} />
                            <SubTable title="Administradores" data={filteredAdmins} term={searchTermAdmins} setTerm={setSearchTermAdmins} onEdit={handleEditClick} onDelete={handleDelete} loading={isActionLoading} />
                        </>
                    )}
                </section>
            )}

            {/* ABA SOLICITAÇÕES */}
            {activeTab === 'solicitacoes' && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Solicitações Pendentes</h2>
                    {isLoadingSolicitacoes && <p className={styles.loadingText}>A carregar solicitações...</p>}
                    {!isLoadingSolicitacoes && solicitacoes.length === 0 && <p>Nenhuma solicitação pendente.</p>}
                    {!isLoadingSolicitacoes && solicitacoes.length > 0 && (
                        <table className={styles.table}>
                            <thead><tr><th className={styles.th}>ID</th><th className={styles.th}>Nome</th><th className={styles.th}>Email</th><th className={styles.th}>Ações</th></tr></thead>
                            <tbody>
                                {solicitacoes.map((sol) => (
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

            {/* ABA ESTATÍSTICAS */}
            {activeTab === 'estatisticas' && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Estatísticas do Sistema</h2>
                    <div style={{ background: '#fff', padding: 18, borderRadius: 8, border: '1px solid #eee' }}>
                        {/* ADICIONE adminUser={user} AQUI */}
                        <DashboardStatsInline apiBaseUrl={apiUrl} adminUser={user} />
                    </div>
                </section>
            )}

            {/* MODALS (Criação e Edição) */}
            {showCreatePopup && (
                <div className={styles.popupOverlay} ref={createPopupRef}>
                    <div className={styles.popupContent}>
                        <h2>Criar um novo usuário</h2>
                        {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
                        <form onSubmit={handleCreateSubmit}>
                            <div className={styles.formRow}><label className={styles.formLabel}>Nome:</label><input name="nome" value={createFormData.nome} onChange={handleCreateFormChange} className={styles.formInput} required /></div>
                            <div className={styles.formRow}><label className={styles.formLabel}>Email:</label><input type="email" name="email" value={createFormData.email} onChange={handleCreateFormChange} className={styles.formInput} required /></div>
                            <div className={styles.formRow}><label className={styles.formLabel}>Senha:</label><input type="password" name="senha" value={createFormData.senha} onChange={handleCreateFormChange} className={styles.formInput} minLength={8} required /></div>
                            <div className={styles.formRow}><label className={styles.formLabel}>Perfil:</label>
                                <select name="perfil" value={createFormData.perfil} onChange={handleCreateFormChange} className={styles.formSelect} required>
                                    <option value="comum">Comum (Aluno)</option><option value="professor">Professor</option><option value="bibliotecario">Bibliotecário</option><option value="admin">Admin</option>
                                </select>
                            </div>
                            {createFormData.perfil === 'comum' && (<div className={styles.formRow}><label className={styles.formLabel}>RA:</label><input name="ra" value={createFormData.ra} onChange={handleCreateFormChange} maxLength={13} className={styles.formInput} placeholder="(Obrigatório)" /></div>)}
                            <div className={styles.formActions}>
                                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>Criar</button>
                                <button type="button" onClick={handleCancelCreate} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditPopup && editingUser && (
                <div className={styles.popupOverlay} ref={editPopupRef}>
                    <div className={styles.popupContent}>
                        <h2>Editar Usuário (ID: {editingUser.usuario_id})</h2>
                        {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
                        <form onSubmit={handleUpdateSubmit}>
                            <div className={styles.formRow}><label className={styles.formLabel}>Nome:</label><input name="nome" value={editFormData.nome || ''} onChange={handleEditFormChange} className={styles.formInput} required /></div>
                            <div className={styles.formRow}><label className={styles.formLabel}>Email:</label><input type="email" name="email" value={editFormData.email || ''} onChange={handleEditFormChange} className={styles.formInput} required /></div>
                            <div className={styles.formRow}><label className={styles.formLabel}>Perfil:</label>
                                <select name="perfil" value={editFormData.perfil} onChange={handleEditFormChange} className={styles.formSelect} required>
                                    <option value="comum">Comum (Aluno)</option><option value="professor">Professor</option><option value="bibliotecario">Bibliotecário</option><option value="admin">Admin</option>
                                </select>
                            </div>
                            {editFormData.perfil === 'comum' && (<div className={styles.formRow}><label className={styles.formLabel}>RA:</label><input name="ra" value={editFormData.ra || ''} onChange={handleEditFormChange} maxLength={13} className={styles.formInput} /></div>)}
                            <div className={styles.formRow}><label className={styles.formLabel}>Status:</label>
                                <select name="status_conta" value={editFormData.status_conta} onChange={handleEditFormChange} className={styles.formSelect} required>
                                    <option value="ativa">Ativa</option><option value="inativa">Inativa</option>
                                </select>
                            </div>
                            <div className={styles.formActions}>
                                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>Salvar</button>
                                <button type="button" onClick={handleCancelEdit} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponente para limpar as tabelas de usuários
const SubTable = ({ title, data, term, setTerm, onEdit, onDelete, loading }) => (
    <div className={styles.subSection}>
        <h3 className={styles.subSectionTitle}>{title}</h3>
        <div className={styles.searchContainer}>
            <input type="text" placeholder={`Pesquisar ${title}...`} value={term} onChange={(e) => setTerm(e.target.value)} className={styles.searchInput} />
        </div>
        {data.length === 0 ? <p>Nenhum encontrado.</p> : (
            <table className={styles.table}>
                <thead><tr><th className={styles.th}>ID</th><th className={styles.th}>Nome</th><th className={styles.th}>Email</th><th className={styles.th}>Status</th><th className={styles.th}>Ações</th></tr></thead>
                <tbody>
                    {data.map(u => (
                        <tr key={u.usuario_id}>
                            <td className={styles.td}>{u.usuario_id}</td><td className={styles.td}>{u.nome}</td><td className={styles.td}>{u.email}</td><td className={styles.td}>{u.status_conta}</td>
                            <td className={styles.td}>
                                <button onClick={() => onEdit(u)} className={`${styles.button} ${styles.editButton}`} disabled={loading}>Editar</button>
                                <button onClick={() => onDelete(u.usuario_id, u.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={loading}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);