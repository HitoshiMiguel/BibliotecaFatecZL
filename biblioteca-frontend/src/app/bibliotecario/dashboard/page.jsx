'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

import styles from './dashboard-bibliotecario.module.css';

import { MyEditModal } from './MyEditModal.jsx';
import { NewUploadModal } from './NewUploadModal';

const API_URL = 'http://localhost:4000';

// Helper para datas (DATETIME -> dd/mm/aaaa)
function formatDateTimeBR(value) {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('pt-BR');
}

// Helper para DATE em formato ISO (AAAA-MM-DD) -> dd/mm/aaaa
function formatDateISOToBR(value) {
  if (!value) return '—';
  const onlyDate = String(value).split('T')[0]; // garante remover hora caso venha
  const [ano, mes, dia] = onlyDate.split('-');
  if (!ano || !mes || !dia) return value;
  return `${dia}/${mes}/${ano}`;
}

// ====================================================================
// = DASHBOARD DO BIBLIOTECÁRIO
// ====================================================================
export default function DashboardBibliotecarioPage() {
  // Aba ativa: 'pendentes' | 'gerenciar' | 'reservas'
  const [abaAtiva, setAbaAtiva] = useState('pendentes');

  // Submissões pendentes
  const [submissoesPendentes, setSubmissoesPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [erroPendentes, setErroPendentes] = useState(null);

  // Publicações aprovadas (para gerenciar)
  const [publicacoes, setPublicacoes] = useState([]);
  const [loadingGerenciar, setLoadingGerenciar] = useState(false);
  const [erroGerenciar, setErroGerenciar] = useState('');

  // Reservas de livros físicos
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [erroReservas, setErroReservas] = useState('');

  // Estados compartilhados
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const [editingItem, setEditingItem] = useState(null); // item sendo editado no modal
  const [editMode, setEditMode] = useState('pendente'); // 'pendente' | 'gerenciar'

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // -----------------------------------------------------------
  // Função para carregar publicações aprovadas (reutilizável)
  // -----------------------------------------------------------
  const getPublicacoesAprovadas = async () => {
    setLoadingGerenciar(true);
    setErroGerenciar('');
    try {
      // Usa a rota pública de publicações (apenas aprovadas)
      const res = await fetch(`${API_URL}/api/publicacoes`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao carregar publicações.');
      }
      setPublicacoes(data.items || []);
    } catch (err) {
      console.error(err);
      setErroGerenciar(err.message || 'Erro ao carregar publicações.');
    } finally {
      setLoadingGerenciar(false);
    }
  };

  const handleUploadComplete = (novoItemAprovado) => {
    console.log('Novo item publicado:', novoItemAprovado);
    setIsUploadModalOpen(false);
    // Joga o novo item pra lista de aprovadas
    setPublicacoes((prev) => [...prev, novoItemAprovado]);
  };

  // ==========================================
  // = BUSCAR SUBMISSÕES PENDENTES (aba 1)
  // ==========================================
  useEffect(() => {
    async function getSubmissoesPendentes() {
      setLoadingPendentes(true);
      setErroPendentes(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/submissoes/pendentes`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setErroPendentes('Não autorizado. Faça login novamente.');
          } else {
            setErroPendentes('Falha ao buscar dados do servidor.');
          }
          throw new Error('Falha na requisição');
        }

        const data = await res.json();
        setSubmissoesPendentes(data || []);
      } catch (err) {
        console.error(err);
        setSubmissoesPendentes([]);
      } finally {
        setLoadingPendentes(false);
      }
    }

    getSubmissoesPendentes();
  }, []);

  // ==========================================
  // = BUSCAR PUBLICAÇÕES APROVADAS (aba 2)
  // ==========================================
  useEffect(() => {
    // Só roda se a aba 'gerenciar' estiver ativa
    if (abaAtiva !== 'gerenciar') return;

    // Se já temos dados, não busca de novo (exceto se forçarmos)
    if (publicacoes.length > 0 || loadingGerenciar) return;

    getPublicacoesAprovadas();
  }, [abaAtiva, publicacoes.length, loadingGerenciar]);

  // ==========================================
  // = BUSCAR RESERVAS (aba 3 - "reservas")
  // ==========================================
  const getReservas = async () => {
    setLoadingReservas(true);
    setErroReservas('');
    try {
      const res = await fetch(`${API_URL}/api/admin/reservas`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Falha ao carregar reservas.');
      }

      setReservas(data || []);
    } catch (err) {
      console.error(err);
      setErroReservas(err.message || 'Erro ao carregar reservas.');
      setReservas([]);
    } finally {
      setLoadingReservas(false);
    }
  };

  useEffect(() => {
    if (abaAtiva !== 'reservas') return;
    if (reservas.length > 0 || loadingReservas) return;
    getReservas();
  }, [abaAtiva, reservas.length, loadingReservas]);

  // ==========================================
  // = AÇÕES: APROVAR / REPROVAR PENDENTES
  // ==========================================
  const handleAprovar = async (id) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${id}/aprovar`, {
        method: 'POST',
        credentials: 'include',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha ao aprovar');

      Swal.fire('Aprovado!', 'A submissão foi aprovada com sucesso.', 'success');

      // 1. Remove da lista de pendentes
      setSubmissoesPendentes((prev) =>
        prev.filter((sub) => sub.submissao_id !== id)
      );

      // 2. Invalida a lista de aprovadas pra forçar recarregar depois
      setPublicacoes([]);

      // Fecha o modal se for o item atual
      if (editingItem && editingItem.submissao_id === id) {
        setEditingItem(null);
      }
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReprovar = async (id) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'A submissão será rejeitada e o arquivo apagado. Esta ação não pode ser revertida!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, reprovar!',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(id);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/submissoes/${id}/reprovar`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao reprovar');

      Swal.fire(
        'Reprovado!',
        'A submissão foi reprovada e o arquivo apagado.',
        'success'
      );

      // Remove da lista de pendentes
      setSubmissoesPendentes((prev) =>
        prev.filter((sub) => sub.submissao_id !== id)
      );
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // = AÇÃO: EXCLUIR PUBLICAÇÃO APROVADA
  // ==========================================
  const handleExcluirPublicacao = async (submissaoId) => {
    const pub = publicacoes.find((p) => p.submissao_id === submissaoId);
    const titulo = pub?.titulo_proposto || 'esta publicação';

    const result = await Swal.fire({
      title: 'Excluir publicação?',
      text: `Esta ação irá remover "${titulo}" do acervo e apagar o arquivo do Google Drive. Isso não pode ser desfeito.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(submissaoId);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/submissoes/${submissaoId}/deletar-aprovada`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao excluir publicação.');
      }

      Swal.fire(
        'Excluída!',
        'A publicação foi removida com sucesso.',
        'success'
      );

      // Remove da lista de aprovadas
      setPublicacoes((prev) =>
        prev.filter((p) => p.submissao_id !== submissaoId)
      );

      // Fecha o modal se for o item que estava aberto
      if (editingItem && editingItem.submissao_id === submissaoId) {
        setEditingItem(null);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // = AÇÃO: VISUALIZAR ARQUIVO NO DRIVE
  // ==========================================
  const handleViewClick = async (submissaoId) => {
    if (viewingId === submissaoId) return;
    setViewingId(submissaoId);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/submissoes/${submissaoId}/view-link`,
        { credentials: 'include' }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Não foi possível carregar o link do arquivo.'
        );
      }

      if (data.webViewLink) {
        window.open(data.webViewLink, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Link de visualização não encontrado.');
      }
    } catch (err) {
      Swal.fire('Erro', err.message, 'error');
    } finally {
      setViewingId(null);
    }
  };

  // ==========================================
  // = AÇÕES: GERENCIAR RESERVAS
  // ==========================================

  const handleAtenderReserva = async (reservaId) => {
    const reserva = reservas.find((r) => r.reserva_id === reservaId);
    const titulo = reserva?.titulo || 'este item';

    const result = await Swal.fire({
      title: 'Marcar como retirada?',
      text: `Confirmar atendimento da reserva para "${titulo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, atender',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(reservaId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reservas/${reservaId}/atender`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || 'Falha ao marcar a reserva como atendida.'
        );
      }

      Swal.fire('Sucesso', 'Reserva marcada como atendida.', 'success');

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === reservaId
            ? {
                ...r,
                status: 'atendida',
                data_atendimento:
                  data?.reserva?.data_atendimento || r.data_atendimento,
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    const reserva = reservas.find((r) => r.reserva_id === reservaId);
    const titulo = reserva?.titulo || 'esta reserva';

    const result = await Swal.fire({
      title: 'Cancelar reserva?',
      text: `Tem certeza que deseja cancelar a reserva de "${titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Voltar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(reservaId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reservas/${reservaId}/cancelar`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || 'Falha ao cancelar a reserva.'
        );
      }

      Swal.fire('Cancelada', 'Reserva cancelada com sucesso.', 'success');

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === reservaId
            ? {
                ...r,
                status: 'cancelada',
                data_atendimento:
                  data?.reserva?.data_atendimento || r.data_atendimento,
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // concluir reserva
  const handleConcluirReserva = async (reservaId) => {
    const reserva = reservas.find((r) => r.reserva_id === reservaId);
    const titulo = reserva?.titulo || 'este item';

    const result = await Swal.fire({
      title: 'Concluir reserva?',
      text: `Confirmar devolução do livro "${titulo}" e encerrar a reserva?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, concluir',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(reservaId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reservas/${reservaId}/concluir`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || 'Falha ao concluir a reserva.'
        );
      }

      Swal.fire('Concluída', 'Reserva concluída com sucesso.', 'success');

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === reservaId
            ? {
                ...r,
                status: 'concluida',
                data_atendimento:
                  data?.reserva?.data_atendimento || r.data_atendimento,
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

    const formatISODate = (value) => {
      if (!value) return '—';
      // Garante que vamos pegar só a parte AAAA-MM-DD
      const raw = String(value).split('T')[0];
      const [year, month, day] = raw.split('-');
      if (!year || !month || !day) return value;
      return `${day}/${month}/${year}`;
    };

    const handleRenovarReserva = async (reservaId) => {
    const reserva = reservas.find((r) => r.reserva_id === reservaId);
    const titulo = reserva?.titulo || 'este item';

    const result = await Swal.fire({
      title: 'Renovar empréstimo?',
      text: `Deseja renovar o empréstimo do livro "${titulo}" por mais 7 dias?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, renovar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setUpdatingId(reservaId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reservas/${reservaId}/renovar`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || 'Falha ao renovar a reserva.'
        );
      }

      Swal.fire(
        'Renovada!',
        'Reserva renovada com sucesso. Nova data de devolução aplicada.',
        'success'
      );

      setReservas((prev) =>
        prev.map((r) =>
          r.reserva_id === reservaId
            ? {
                ...r,
                data_prevista_devolucao:
                  data?.reserva?.data_prevista_devolucao ||
                  r.data_prevista_devolucao,
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };


  // ==========================================
  // = RENDERIZAÇÃO DA ABA "PENDENTES"
  // ==========================================
  const renderPendentes = () => {
    if (loadingPendentes) {
      return <p>A carregar submissões...</p>;
    }

    if (erroPendentes) {
      return <p style={{ color: 'red' }}>{erroPendentes}</p>;
    }

    if (submissoesPendentes.length === 0) {
      return <p>Nenhuma submissão pendente no momento.</p>;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.tabelaSubmissoes}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Tipo</th>
              <th>Enviado por</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {submissoesPendentes.map((sub) => (
              <tr key={sub.submissao_id}>
                <td data-label="Título:">{sub.titulo_proposto}</td>
                <td data-label="Autor:">{sub.autor || '—'}</td>
                <td data-label="Tipo:">
                  {sub.tipo ? sub.tipo.toUpperCase() : '—'}
                </td>
                <td data-label="Enviado por:">{sub.nome_remetente}</td>
                <td data-label="Data:">
                  {new Date(sub.data_submissao).toLocaleDateString('pt-BR')}
                </td>
                <td data-label="Ações:">
                  <div className={styles.acoes}>
                    <button
                      className={styles.btnVisualizar}
                      onClick={() => handleViewClick(sub.submissao_id)}
                      disabled={
                        viewingId === sub.submissao_id ||
                        updatingId === sub.submissao_id
                      }
                    >
                      {viewingId === sub.submissao_id ? '...' : 'Visualizar'}
                    </button>

                    <button
                      className={styles.btnAnalisar}
                      onClick={() => {
                        setEditMode('pendente');
                        setEditingItem(sub);
                      }}
                      disabled={
                        updatingId === sub.submissao_id ||
                        viewingId === sub.submissao_id
                      }
                    >
                      {updatingId === sub.submissao_id ? '...' : 'Analisar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ==========================================
  // = RENDERIZAÇÃO DA ABA "GERENCIAR SUBMISSÕES"
  // ==========================================
  const renderGerenciar = () => {
    if (loadingGerenciar) {
      return <p>Carregando publicações aprovadas...</p>;
    }

    if (erroGerenciar) {
      return <p style={{ color: 'red' }}>{erroGerenciar}</p>;
    }

    if (publicacoes.length === 0) {
      return <p>Nenhuma publicação aprovada encontrada.</p>;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.tabelaSubmissoes}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Tipo</th>
              <th>Ano</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {publicacoes.map((pub, index) => (
              <tr key={pub.submissao_id || pub.id ||`pub-${index}`}>
                <td data-label="Título:">{pub.titulo_proposto}</td>
                <td data-label="Autor:">{pub.autor || '—'}</td>
                <td data-label="Tipo:">
                  {pub.tipo ? pub.tipo.toUpperCase() : '—'}
                </td>
                <td data-label="Ano:">
                  {pub.ano_publicacao || pub.ano_defesa || '—'}
                </td>
                <td data-label="Ações:">
                  <div className={styles.acoes}>
                    <button
                      className={styles.btnVisualizar}
                      onClick={() => handleViewClick(pub.submissao_id)}
                      disabled={
                        viewingId === pub.submissao_id ||
                        updatingId === pub.submissao_id
                      }
                    >
                      {viewingId === pub.submissao_id ? '...' : 'Visualizar'}
                    </button>

                    <button
                      className={styles.btnAnalisar}
                      onClick={() => {
                        setEditMode('gerenciar');
                        setEditingItem(pub);
                      }}
                      disabled={
                        updatingId === pub.submissao_id ||
                        viewingId === pub.submissao_id
                      }
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ==========================================
  // = RENDERIZAÇÃO DA ABA "RESERVAS"
  // ==========================================
  const renderReservas = () => {
    if (loadingReservas) {
      return <p>Carregando reservas...</p>;
    }

    if (erroReservas) {
      return <p style={{ color: 'red' }}>{erroReservas}</p>;
    }

    if (reservas.length === 0) {
      return <p>Nenhuma reserva encontrada.</p>;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.tabelaSubmissoes}>
          <thead>
            <tr>
              <th>Livro</th>
              <th>Usuário</th>
              <th>Status</th>
              <th>Data da reserva</th>
              <th>Retirada prevista</th>
              <th>Devolução prevista</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
          {reservas.map((r) => (
            <tr key={r.reserva_id}>
              <td data-label="Livro:">{r.titulo}</td>
              <td data-label="Usuário:">
                {r.usuario_nome}
                {r.usuario_ra ? ` (${r.usuario_ra})` : ''}
              </td>
              <td data-label="Status:">
                {r.status === 'ativa'
                  ? 'Ativa'
                  : r.status === 'atendida'
                  ? 'Atendida'
                  : r.status === 'concluida'
                  ? 'Concluída'
                  : 'Cancelada'}
              </td>
              <td data-label="Data da reserva:">
                {formatISODate(r.data_reserva)}
              </td>
              <td data-label="Retirada prevista:">
                {formatISODate(r.data_prevista_retirada)}
              </td>
              <td data-label="Devolução prevista:">
                {formatISODate(r.data_prevista_devolucao)}
              </td>

              <td data-label="Ações:">
                <div className={styles.acoes}>
                  {/* Status ATIVA → pode Atender + Cancelar */}
                  {r.status === 'ativa' && (
                    <>
                      <button
                        className={styles.btnAnalisar}
                        onClick={() => handleAtenderReserva(r.reserva_id)}
                        disabled={updatingId === r.reserva_id}
                      >
                        {updatingId === r.reserva_id ? '...' : 'Atender'}
                      </button>
                      <button
                        className={styles.btnVisualizar}
                        onClick={() => handleCancelarReserva(r.reserva_id)}
                        disabled={updatingId === r.reserva_id}
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {/* Status ATENDIDA → pode Concluir, Cancelar e Renovar */}
                  {r.status === 'atendida' && (
                    <>
                      <button
                        className={styles.btnAnalisar}
                        onClick={() => handleConcluirReserva(r.reserva_id)}
                        disabled={updatingId === r.reserva_id}
                      >
                        {updatingId === r.reserva_id ? '...' : 'Concluir'}
                      </button>
                      <button
                        className={styles.btnVisualizar}
                        onClick={() => handleCancelarReserva(r.reserva_id)}
                        disabled={updatingId === r.reserva_id}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles.btnVisualizar}
                        onClick={() => handleRenovarReserva(r.reserva_id)}
                        disabled={updatingId === r.reserva_id}
                      >
                        Renovar
                      </button>
                    </>
                  )}

                  {/* Status CONCLUÍDA / CANCELADA → apenas histórico, sem ações */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>

        </table>
      </div>
    );
  };

  // ==========================================
  // = RENDER PRINCIPAL
  // ==========================================
  return (
    <>
      <div className={styles.container}>
        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Painel Bibliotecário</h1>
            <p>
              {abaAtiva === 'pendentes'
                ? 'Abaixo estão as submissões que estão pendentes para análise.'
                : abaAtiva === 'gerenciar'
                ? 'Gerencie as informações das publicações já aprovadas no acervo.'
                : 'Visualize e gerencie as reservas de livros físicos.'}
            </p>

            {/* Botões de troca de aba */}
            <div className={styles.tabsRow}>
              <button
                type="button"
                className={
                  abaAtiva === 'pendentes'
                    ? `${styles.tabButton} ${styles.tabButtonActive}`
                    : styles.tabButton
                }
                onClick={() => setAbaAtiva('pendentes')}
              >
                Submissões pendentes
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'gerenciar'
                    ? `${styles.tabButton} ${styles.tabButtonActive}`
                    : styles.tabButton
                }
                onClick={() => setAbaAtiva('gerenciar')}
              >
                Gerenciar submissões
              </button>

              <button
                type="button"
                className={
                  abaAtiva === 'reservas'
                    ? `${styles.tabButton} ${styles.tabButtonActive}`
                    : styles.tabButton
                }
                onClick={() => setAbaAtiva('reservas')}
              >
                Reservas
              </button>
            </div>
          </div>

          <button
            className={styles.btnPublicarNovo}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Nova Publicação
          </button>
        </div>

        {/* Conteúdo condicional conforme a aba */}
        {abaAtiva === 'pendentes'
          ? renderPendentes()
          : abaAtiva === 'gerenciar'
          ? renderGerenciar()
          : renderReservas()}
      </div>

      {editingItem && (
        <MyEditModal
          mode={editMode}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaveAndApprove={handleAprovar}
          onReprove={handleReprovar}
          onDeleteApproved={handleExcluirPublicacao}
          onSaved={(updated) => {
            if (editMode === 'gerenciar') {
              setPublicacoes((prev) =>
                prev.map((p) =>
                  p.submissao_id === updated.submissao_id
                    ? { ...p, ...updated }
                    : p
                )
              );
            }
          }}
        />
      )}

      {/* Modal de upload direto */}
      {isUploadModalOpen && (
        <NewUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
}
