// app/admin/dashboard/page.jsx (Refatorado com listas separadas, correção de hidratação e mais espaçamento)

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from './dashboard-admin.module.css';

export default function AdminDashboardPage() {
    // Estados para dados
    const [users, setUsers] = useState([]);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingSolicitacoes, setIsLoadingSolicitacoes] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    // --- NOVOS ESTADOS PARA POPUP DE CRIAÇÃO ---
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [createFormData, setCreateFormData] = useState({ // Estado inicial do formulário de criação
        nome: '',
        email: '',
        ra: '',
        senha: '',
        perfil: 'comum', // Padrão pode ser 'comum'
        status_conta: 'ativa' // Padrão
    });
    const createPopupRef = useRef(null); // Ref para o popup de criação
    // ------------------------------------------

    // Estados para Popup de Edição
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const editPopupRef = useRef(null);

    // Estados de Pesquisa
    const [searchTermAlunos, setSearchTermAlunos] = useState('');
    const [searchTermProfessores, setSearchTermProfessores] = useState('');
    const [searchTermBibliotecarios, setSearchTermBibliotecarios] = useState('');
    const [searchTermAdmins, setSearchTermAdmins] = useState('');

    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


    // --- FUNÇÕES DE BUSCA DE DADOS ---

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        setError('');
        try {
            const response = await fetch(`${apiUrl}/admin/usuarios`, { method: 'GET', credentials: 'include', cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Erro fetchUsers:", err);
            setError('Falha ao carregar lista de usuários.');
            if (err.message?.includes('401') || err.message?.includes('403')) {
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
            const response = await fetch(`${apiUrl}/admin/solicitacoes`, { method: 'GET', credentials: 'include', cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSolicitacoes(data);
        } catch (err) {
             console.error("Erro fetchSolicitacoes:", err);
            setError('Falha ao carregar lista de solicitações pendentes.');
            if (err.message?.includes('401') || err.message?.includes('403')) {
                  setTimeout(() => router.push('/login'), 1500);
             }
        } finally {
            setIsLoadingSolicitacoes(false);
        }
    };


    // --- EFEITO INICIAL PARA BUSCAR DADOS ---

    useEffect(() => {
        document.title = 'Painel Admin | Biblioteca Fatec ZL';

        const checkAuth = async () => {
             try {
                const res = await fetch(`${apiUrl}/auth/current-user`, {credentials: 'include', cache: 'no-store'});
                if (!res.ok) {
                    console.log("CheckAuth falhou, redirecionando para login...");
                    router.push('/login');
                    return false;
                }
                 const user = await res.json();
                 if (user.perfil !== 'admin' && user.perfil !== 'bibliotecario') {
                     console.log("CheckAuth: Perfil não autorizado, redirecionando para dashboard...");
                     router.push('/dashboard');
                     return false;
                 }
                 console.log("CheckAuth: Autorizado.");
                return true;
             } catch(err) {
                 console.error("Erro no checkAuth:", err);
                 router.push('/login');
                 return false;
             }
        };

        checkAuth().then(isAuthorized => {
            console.log("CheckAuth concluído. Autorizado:", isAuthorized);
            if (isAuthorized) {
                console.log("Buscando dados iniciais...");
                fetchUsers();
                fetchSolicitacoes();
            } else {
                console.log("Não autorizado, parando carregamento inicial.");
                setIsLoadingUsers(false);
                setIsLoadingSolicitacoes(false);
            }
        });
    }, [router]);


    // --- FUNÇÕES PARA O POPUP DE EDIÇÃO ---

    const handleEditClick = (user) => {
        console.log("handleEditClick chamado para:", user);
        setEditingUser(user);
        setEditFormData({ ...user }); // Clona dados para o form
        setShowEditPopup(true);
        setError('');
        setMessage('');
        setTimeout(() => {
            editPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };


    const handleCancelEdit = () => {
        console.log("handleCancelEdit chamado.");
        setShowEditPopup(false);
        setEditingUser(null);
        setEditFormData({});
        setError(''); // Limpa erro do popup ao cancelar
    };


    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        console.log(`handleEditFormChange: Campo ${name} mudou para ${value}`);
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
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
        console.log(`handleUpdateSubmit: Enviando para ID ${userId}:`, dataToUpdate);

        try {
            const response = await fetch(`${apiUrl}/admin/usuarios/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dataToUpdate)
            });
            const data = await response.json();

            if (response.ok) {
                console.log(`Update para ID ${userId} bem-sucedido.`);

                Swal.fire({
                title: 'Sucesso!',
                text: `Usuário ${dataToUpdate.nome} (ID: ${userId}) foi atualizado.`,
                icon: 'success',
                timer: 2000, // Opcional: fecha automaticamente após 2 segundos
                showConfirmButton: false
            });
                handleCancelEdit(); // Fecha popup
                // Atualiza lista local
                setUsers(prevUsers => prevUsers.map(u =>
                    u.usuario_id === userId ? { ...editingUser, ...dataToUpdate, ra: dataToUpdate.ra } : u
                ));
            } else {
                console.error(`Falha no update para ID ${userId}:`, data.message);
                setError(data.message || 'Falha ao atualizar.');
            }
        } catch (err) {
            console.error(`Erro de rede no update para ID ${userId}:`, err);
            setError('Erro de rede ao atualizar.');
        } finally {
            setIsActionLoading(false);
        }
    };


    // --- FUNÇÃO DE EXCLUSÃO ---

     const handleDelete = async (userId, userName) => {
        setError('');
        setMessage('');
        console.log(`handleDelete iniciado para ID ${userId}`);

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

        if (result.isConfirmed) {
            console.log(`Confirmada exclusão para ID ${userId}`);
            setIsActionLoading(true);
            try {
                const response = await fetch(`${apiUrl}/admin/usuarios/${userId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok) {
                    console.log(`Exclusão de ID ${userId} bem-sucedida.`);
                    setMessage(`Usuário ${userId} excluído.`);
                    setUsers(prevUsers => prevUsers.filter(u => u.usuario_id !== userId)); // Remove da lista
                } else {
                    console.error(`Falha na exclusão de ID ${userId}:`, data.message);
                    setError(data.message || `Falha ao excluir ${userId}.`);
                }
            } catch (err) {
                console.error(`Erro de rede na exclusão de ID ${userId}:`, err);
                setError('Erro de rede ao excluir.');
            } finally {
                setIsActionLoading(false);
            }
        } else {
            console.log(`Exclusão cancelada para ID ${userId}`);
        }
     };


    // --- FUNÇÕES PARA SOLICITAÇÕES ---

    const handleAprovar = async (solicitacaoId, email) => {
        setMessage('');
        setError('');
        setIsActionLoading(true);
        console.log(`handleAprovar chamado para ID ${solicitacaoId}`);

        try {
            const response = await fetch(`${apiUrl}/admin/solicitacoes/${solicitacaoId}/aprovar`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                console.log(`Aprovação de ID ${solicitacaoId} bem-sucedida.`);
                setMessage(`Solicitação ${solicitacaoId} aprovada! E-mail enviado para ${email}.`);
                setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
                fetchUsers(); // Recarrega lista de utilizadores
            } else {
                console.error(`Falha na aprovação de ID ${solicitacaoId}:`, data.message);
                setError(data.message || `Falha ao aprovar ${solicitacaoId}.`);
            }
        } catch (err) {
            console.error(`Erro de rede na aprovação de ID ${solicitacaoId}:`, err);
            setError('Erro de rede ao aprovar.');
        } finally {
            setIsActionLoading(false);
        }
    };


    const handleRejeitar = async (solicitacaoId, email) => {
         setMessage('');
         setError('');
         setIsActionLoading(true);
         console.log(`handleRejeitar chamado para ID ${solicitacaoId}`);

        try {
            const response = await fetch(`${apiUrl}/admin/solicitacoes/${solicitacaoId}/rejeitar`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                console.log(`Rejeição de ID ${solicitacaoId} bem-sucedida.`);
                setMessage(`Solicitação ${solicitacaoId} (${email}) rejeitada.`);
                setSolicitacoes(prev => prev.filter(s => s.solicitacao_id !== solicitacaoId));
            } else {
                console.error(`Falha na rejeição de ID ${solicitacaoId}:`, data.message);
                setError(data.message || `Falha ao rejeitar ${solicitacaoId}.`);
            }
        } catch (err) {
            console.error(`Erro de rede na rejeição de ID ${solicitacaoId}:`, err);
            setError('Erro de rede ao rejeitar.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // --- FUNÇÕES PARA O POPUP DE CRIAÇÃO ---

    // Abre o popup de criação (limpa formulário)
    const handleCreateClick = () => {
        setCreateFormData({ nome: '', email: '', ra: '', senha: '', perfil: 'comum', status_conta: 'ativa' });
        setShowCreatePopup(true);
        setError(''); // Limpa erros gerais
        setMessage('');
        setTimeout(() => { // Rola para o popup
            createPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    // Fecha o popup de criação
    const handleCancelCreate = () => {
        setShowCreatePopup(false);
        setCreateFormData({}); // Limpa o formulário
        setError(''); // Limpa erro do popup
    };

    // Atualiza o estado do formulário de criação
    const handleCreateFormChange = (event) => {
        const { name, value } = event.target;
        setCreateFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
         // Limpa RA se o perfil não for 'comum'
         if (name === 'perfil' && value !== 'comum') {
             setCreateFormData(prev => ({ ...prev, ra: '' }));
         }
    };

    // Submete o novo utilizador
    const handleCreateSubmit = async (event) => {
        event.preventDefault();
        setIsActionLoading(true); setMessage(''); setError('');

        // Prepara dados (RA opcional dependendo do perfil)
        const dataToCreate = {
            ...createFormData,
            ra: createFormData.perfil === 'comum' ? createFormData.ra : null
        };
        // Remove confirmarSenha se existir no estado, pois não é enviado para a API
        delete dataToCreate.confirmarSenha; 

        // Validação básica frontend (ex: senha) - pode adicionar mais
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


        console.log("handleCreateSubmit: Enviando dados:", dataToCreate);

        try {
            // Chama a API POST /api/admin/usuarios
            const response = await fetch(`${apiUrl}/admin/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dataToCreate),
            });
            const data = await response.json();

            if (response.ok || response.status === 201) {
                setMessage(data.message || `Usuário ${dataToCreate.perfil} criado com sucesso.`);
                handleCancelCreate(); // Fecha o popup
                fetchUsers(); // Atualiza a lista de utilizadores
            } else {
                setError(data.message || 'Falha ao criar usuário.');
                // Não fecha o popup em caso de erro
            }
        } catch (err) {
            console.error("Erro ao criar usuário:", err);
            setError('Erro de rede ao tentar criar usuário.');
        } finally {
            setIsActionLoading(false);
        }
    };
    // ------------------------------------------


    // --- FUNÇÃO DE LOGOUT ---

    const handleLogout = async () => {
        console.log("handleLogout chamado.");
         try {
             await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
         } catch(err) {
             console.error("Erro ao chamar API de logout:", err);
         }
         router.push('/login'); // Redireciona independentemente do erro da API
    };


    // --- LÓGICA DE FILTRAGEM ---

    const filteredAlunos = useMemo(() => users.filter(user => user.perfil === 'comum' && (user.nome.toLowerCase().includes(searchTermAlunos.toLowerCase()) || user.email.toLowerCase().includes(searchTermAlunos.toLowerCase()) || (user.ra && user.ra.includes(searchTermAlunos)))), [users, searchTermAlunos]);
    const filteredProfessores = useMemo(() => users.filter(user => user.perfil === 'professor' && (user.nome.toLowerCase().includes(searchTermProfessores.toLowerCase()) || user.email.toLowerCase().includes(searchTermProfessores.toLowerCase()))), [users, searchTermProfessores]);
    const filteredBibliotecarios = useMemo(() => users.filter(user => user.perfil === 'bibliotecario' && (user.nome.toLowerCase().includes(searchTermBibliotecarios.toLowerCase()) || user.email.toLowerCase().includes(searchTermBibliotecarios.toLowerCase()))), [users, searchTermBibliotecarios]);
    const filteredAdmins = useMemo(() => users.filter(user => user.perfil === 'admin' && (user.nome.toLowerCase().includes(searchTermAdmins.toLowerCase()) || user.email.toLowerCase().includes(searchTermAdmins.toLowerCase()))), [users, searchTermAdmins]);

    const isPageLoading = isLoadingUsers || isLoadingSolicitacoes;


    // --- RENDERIZAÇÃO ---

    return (
        <div className={styles.container}>

            <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
                 Sair (Logout)
             </button>

            <h1>Painel Administrativo</h1>

            {/* Mensagens de feedback GERAIS */}
            {!isPageLoading && error && !showEditPopup && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}
            {!isPageLoading && message && !showEditPopup && <p className={`${styles.message} ${styles.successText}`}>{message}</p>}


            {/* --- Secção: Aprovação de Professores --- */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Solicitações Pendentes</h2>

                {isLoadingSolicitacoes && <p className={styles.loadingText}>A carregar solicitações...</p>}

                {!isLoadingSolicitacoes && solicitacoes.length === 0 && <p>Nenhuma solicitação pendente.</p>}

                {!isLoadingSolicitacoes && solicitacoes.length > 0 && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>ID</th>
                                <th className={styles.th}>Nome</th>
                                <th className={styles.th}>Email</th>
                                <th className={styles.th}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitacoes.map((sol) => (
                                <tr key={sol.solicitacao_id}>
                                    <td className={styles.td}>{sol.solicitacao_id}</td>
                                    <td className={styles.td}>{sol.nome}</td>
                                    <td className={styles.td}>{sol.email}</td>
                                    <td className={styles.td}>
                                        <button
                                            onClick={() => handleAprovar(sol.solicitacao_id, sol.email)}
                                            className={`${styles.button} ${styles.approveButton}`}
                                            disabled={isActionLoading}
                                        >
                                            Aprovar
                                        </button>
                                         <button
                                            onClick={() => handleRejeitar(sol.solicitacao_id, sol.email)}
                                            className={`${styles.button} ${styles.rejectButton}`}
                                            disabled={isActionLoading}
                                        >
                                            Rejeitar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>


           {/* --- Secção: Gerenciar Utilizadores --- */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Gerenciar Usuários</h2>
                 <button onClick={fetchUsers} disabled={isPageLoading || isActionLoading} className={styles.button} style={{marginBottom: '20px'}}>
                     {isLoadingUsers ? 'Carregando...' : 'Atualizar Listas'}
                 </button>
                 {/* --- BOTÃO PARA ABRIR POPUP DE CRIAÇÃO --- */}
                 <button onClick={handleCreateClick} className={`${styles.button} ${styles.createButton}`} disabled={isPageLoading || isActionLoading}>
                     Criar Novo Usuário
                 </button>

                 {/* <button className={`${styles.button} ${styles.createButton}`}>Criar Novo Utilizador</button> */}

                 {isLoadingUsers && <p className={styles.loadingText}>Carregando Usuários...</p>}


                 {/* --- Sub-Secção: Alunos --- */}
                 {!isLoadingUsers && (
                     <div className={styles.subSection}>
                         <h3 className={styles.subSectionTitle}>Alunos (Comum)</h3>
                         <div className={styles.searchContainer}>
                             <input
                                 type="text"
                                 placeholder="Pesquisar Aluno por nome, email ou RA..."
                                 value={searchTermAlunos}
                                 onChange={(e) => setSearchTermAlunos(e.target.value)}
                                 className={styles.searchInput}
                            />
                         </div>
                         {filteredAlunos.length === 0 ? (<p>Nenhum aluno encontrado.</p>) : (
                             <table className={styles.table}>
                                 <thead>
                                     <tr>
                                         <th className={styles.th}>ID</th>
                                         <th className={styles.th}>Nome</th>
                                         <th className={styles.th}>Email</th>
                                         <th className={styles.th}>RA</th>
                                         <th className={styles.th}>Status</th>
                                         <th className={styles.th}>Ações</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                    {filteredAlunos.map((user) => (
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
                 )}


                 {/* --- Sub-Secção: Professores --- */}
                  {!isLoadingUsers && (
                     <div className={styles.subSection}>
                         <h3 className={styles.subSectionTitle}>Professores</h3>
                          <div className={styles.searchContainer}>
                             <input
                                 type="text"
                                 placeholder="Pesquisar Professor por nome ou email..."
                                 value={searchTermProfessores}
                                 onChange={(e) => setSearchTermProfessores(e.target.value)}
                                 className={styles.searchInput}
                            />
                         </div>
                         {filteredProfessores.length === 0 ? (<p>Nenhum professor encontrado.</p>) : (
                             <table className={styles.table}>
                                 <thead>
                                     <tr>
                                         <th className={styles.th}>ID</th>
                                         <th className={styles.th}>Nome</th>
                                         <th className={styles.th}>Email</th>
                                         <th className={styles.th}>Status</th>
                                         <th className={styles.th}>Ações</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                    {filteredProfessores.map((user) => (
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
                 )}


                 {/* --- Sub-Secção: Bibliotecários --- */}
                  {!isLoadingUsers && (
                     <div className={styles.subSection}>
                         <h3 className={styles.subSectionTitle}>Bibliotecários</h3>
                          <div className={styles.searchContainer}>
                             <input
                                 type="text"
                                 placeholder="Pesquisar Bibliotecário por nome ou email..."
                                 value={searchTermBibliotecarios}
                                 onChange={(e) => setSearchTermBibliotecarios(e.target.value)}
                                 className={styles.searchInput}
                            />
                         </div>
                         {filteredBibliotecarios.length === 0 ? (<p>Nenhum bibliotecário encontrado.</p>) : (
                             <table className={styles.table}>
                                 <thead>
                                     <tr>
                                         <th className={styles.th}>ID</th>
                                         <th className={styles.th}>Nome</th>
                                         <th className={styles.th}>Email</th>
                                         <th className={styles.th}>Status</th>
                                         <th className={styles.th}>Ações</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                    {filteredBibliotecarios.map((user) => (
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
                 )}


                 {/* --- Sub-Secção: Administradores --- */}
                   {!isLoadingUsers && (
                     <div className={styles.subSection}>
                         <h3 className={styles.subSectionTitle}>Administradores</h3>
                          <div className={styles.searchContainer}>
                             <input
                                 type="text"
                                 placeholder="Pesquisar Administrador por nome ou email..."
                                 value={searchTermAdmins}
                                 onChange={(e) => setSearchTermAdmins(e.target.value)}
                                 className={styles.searchInput}
                            />
                         </div>
                         {filteredAdmins.length === 0 ? (<p>Nenhum administrador encontrado.</p>) : (
                             <table className={styles.table}>
                                 <thead>
                                     <tr>
                                         <th className={styles.th}>ID</th>
                                         <th className={styles.th}>Nome</th>
                                         <th className={styles.th}>Email</th>
                                         <th className={styles.th}>Status</th>
                                         <th className={styles.th}>Ações</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                    {filteredAdmins.map((user) => (
                                        <tr key={user.usuario_id}>
                                             <td className={styles.td}>{user.usuario_id}</td>
                                            <td className={styles.td}>{user.nome}</td>
                                            <td className={styles.td}>{user.email}</td>
                                            <td className={styles.td}>{user.status_conta}</td>
                                            <td className={styles.td}>
                                                <button onClick={() => handleEditClick(user)} className={`${styles.button} ${styles.editButton}`} disabled={isActionLoading}>Editar</button>
                                                {/* Segurança: Talvez impedir exclusão do último admin? Lógica no backend */}
                                                <button onClick={() => handleDelete(user.usuario_id, user.nome)} className={`${styles.button} ${styles.deleteButton}`} disabled={isActionLoading}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                 </tbody>
                             </table>
                         )}
                     </div>
                 )}
            </section>


            {/* --- NOVO POPUP / MODAL DE CRIAÇÃO --- */}
            {showCreatePopup && (
                <div className={styles.popupOverlay} ref={createPopupRef}>
                    <div className={styles.popupContent}>
                        <h2>Criar um novo usuário</h2>
                        {/* Mostra erro específico da criação */}
                        {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}

                        <form onSubmit={handleCreateSubmit}>
                            {/* Linha Nome */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="create-nome">Nome:</label>
                                <input id="create-nome" type="text" name="nome" value={createFormData.nome} onChange={handleCreateFormChange} className={styles.formInput} required />
                            </div>
                            {/* Linha Email */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="create-email">Email:</label>
                                <input id="create-email" type="email" name="email" value={createFormData.email} onChange={handleCreateFormChange} className={styles.formInput} required />
                            </div>
                            {/* Linha Senha */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="create-senha">Senha:</label>
                                <input id="create-senha" type="password" name="senha" value={createFormData.senha} onChange={handleCreateFormChange} className={styles.formInput} required minLength={8}/>
                            </div>
                             {/* Linha Perfil */}
                             <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="create-perfil">Perfil:</label>
                                <select id="create-perfil" name="perfil" value={createFormData.perfil} onChange={handleCreateFormChange} className={styles.formSelect} required>
                                    <option value="comum">Comum (Aluno)</option>
                                    <option value="professor">Professor</option>
                                    <option value="bibliotecario">Bibliotecário</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                             {/* Linha RA (Condicional baseado no perfil selecionado) */}
                             <div className={styles.formRow} style={{ display: createFormData.perfil === 'comum' ? 'flex' : 'none' }}>
                                <label className={styles.formLabel} htmlFor="create-ra">RA:</label>
                                <input id="create-ra" type="text" name="ra" value={createFormData.ra} onChange={handleCreateFormChange} maxLength={13} className={styles.formInput} placeholder="(Obrigatório se Aluno)"/>
                            </div>
                            {/* Linha Status (Padrão Ativa, talvez não precise no form de criação) */}
                            {/* <div className={styles.formRow}>... Status ...</div> */}

                            {/* Botões */}
                            <div className={styles.formActions}>
                                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>
                                     {isActionLoading ? 'Criando...' : 'Criar Usuário'}
                                 </button>
                                <button type="button" onClick={handleCancelCreate} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>
                                     Cancelar
                                 </button>
                            </div>
                        </form>
                    </div>
                </div>
             )}

             {/* --- POPUP / MODAL DE EDIÇÃO --- */}
            {showEditPopup && editingUser && (
                <div className={styles.popupOverlay} ref={editPopupRef}>
                    <div className={styles.popupContent}>
                        <h2>Editar Usuário (ID: {editingUser.usuario_id})</h2>
                        
                        {/* Mostra erro específico da edição */}
                        {error && <p className={`${styles.message} ${styles.errorText}`}>{error}</p>}

                        <form onSubmit={handleUpdateSubmit}>
                            {/* Linha Nome */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="edit-nome">Nome:</label>
                                <input 
                                    id="edit-nome" 
                                    type="text" 
                                    name="nome" 
                                    value={editFormData.nome || ''} 
                                    onChange={handleEditFormChange} 
                                    className={styles.formInput} 
                                    required 
                                />
                            </div>
                            {/* Linha Email */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="edit-email">Email:</label>
                                <input 
                                    id="edit-email" 
                                    type="email" 
                                    name="email" 
                                    value={editFormData.email || ''} 
                                    onChange={handleEditFormChange} 
                                    className={styles.formInput} 
                                    required 
                                />
                            </div>
                             {/* Linha Perfil */}
                             <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="edit-perfil">Perfil:</label>
                                <select 
                                    id="edit-perfil" 
                                    name="perfil" 
                                    value={editFormData.perfil || 'comum'} 
                                    onChange={handleEditFormChange} 
                                    className={styles.formSelect} 
                                    required
                                >
                                    <option value="comum">Comum (Aluno)</option>
                                    <option value="professor">Professor</option>
                                    <option value="bibliotecario">Bibliotecário</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {/* Linha RA (Condicional) */}
                            <div className={styles.formRow} style={{ display: editFormData.perfil === 'comum' ? 'flex' : 'none' }}>
                                <label className={styles.formLabel} htmlFor="edit-ra">RA:</label>
                                <input 
                                    id="edit-ra" 
                                    type="text" 
                                    name="ra" 
                                    value={editFormData.ra || ''} 
                                    onChange={handleEditFormChange} 
                                    maxLength={13} 
                                    className={styles.formInput} 
                                    placeholder="(Obrigatório se Aluno)"
                                />
                            </div>
                            {/* Linha Status */}
                            <div className={styles.formRow}>
                                <label className={styles.formLabel} htmlFor="edit-status">Status:</label>
                                <select 
                                    id="edit-status" 
                                    name="status_conta" 
                                    value={editFormData.status_conta || 'ativa'} 
                                    onChange={handleEditFormChange} 
                                    className={styles.formSelect} 
                                    required
                                >
                                    <option value="ativa">Ativa</option>
                                    <option value="inativa">Inativa</option>
                                    {/* Adicione outros status se houver */}
                                </select>
                            </div>

                            {/* Botões */}
                            <div className={styles.formActions}>
                                <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isActionLoading}>
                                    {isActionLoading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                                <button type="button" onClick={handleCancelEdit} className={`${styles.button} ${styles.cancelButton}`} disabled={isActionLoading}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* FIM DO POPUP DE EDIÇÃO */}

        </div> // Fim do container principal
    );
}