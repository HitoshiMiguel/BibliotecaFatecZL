// src/app/bibliotecario/dashboard/page.jsx
'use client'; 

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

import styles from './dashboard-bibliotecario.module.css'; 

import { EditModal } from './MyEditModal.jsx';
import { NewUploadModal } from './NewUploadModal';

const API_URL = 'http://localhost:4000';

// ====================================================================
// = DASHBOARD DO BIBLIOTECÁRIO
// ====================================================================
export default function DashboardBibliotecarioPage() {
  // Aba ativa: 'pendentes' | 'gerenciar'
  const [abaAtiva, setAbaAtiva] = useState('pendentes');

  // Submissões pendentes
  const [submissoesPendentes, setSubmissoesPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [erroPendentes, setErroPendentes] = useState(null);

  // Publicações aprovadas (para gerenciar)
  const [publicacoes, setPublicacoes] = useState([]);
  const [loadingGerenciar, setLoadingGerenciar] = useState(false);
  const [erroGerenciar, setErroGerenciar] = useState('');

  // Estados compartilhados
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const [editingItem, setEditingItem] = useState(null); // item sendo editado no modal
  const [editMode, setEditMode] = useState('pendente'); // 'pendente' | 'gerenciar'

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
    if (abaAtiva !== 'gerenciar') return;
    if (publicacoes.length > 0 || loadingGerenciar) return;

    async function getPublicacoesAprovadas() {
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
    }

    getPublicacoesAprovadas();
  }, [abaAtiva, publicacoes.length, loadingGerenciar]);

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

      // Remove da lista de pendentes
      setSubmissoesPendentes((prev) =>
        prev.filter((sub) => sub.submissao_id !== id)
      );

      // Se a gente estava com o item aberto no modal, reaproveita esse objeto
      setPublicacoes((prev) => {
        const justApproved = editingItem && editingItem.submissao_id === id
          ? editingItem
          : null;
        return justApproved ? [...prev, justApproved] : prev;
      });

    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
      setUpdatingId(null); 
    }
  };

  const handleReprovar = async (id) => {
    const result = await Swal.fire({
      title: 'Tem a certeza?',
      text: "A submissão será rejeitada e o arquivo apagado. Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, reprovar!',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setUpdatingId(id); 
    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${id}/reprovar`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao reprovar');

      Swal.fire('Reprovado!', 'A submissão foi reprovada e o arquivo apagado.', 'success');

      // Remove da lista de pendentes
      setSubmissoesPendentes((prev) =>
        prev.filter((sub) => sub.submissao_id !== id)
      );

    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
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
        throw new Error(data.message || 'Não foi possível carregar o link do arquivo.');
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
                <td data-label="Título:">
                  {sub.titulo_proposto}
                </td>
                <td data-label="Autor:">
                  {sub.autor || '—'}
                </td>
                <td data-label="Tipo:">
                  {sub.tipo ? sub.tipo.toUpperCase() : '—'}
                </td>
                <td data-label="Enviado por:">
                  {sub.nome_remetente}
                </td>
                <td data-label="Data:">
                  {new Date(sub.data_submissao).toLocaleDateString('pt-BR')}
                </td>
                <td data-label="Ações:">
                  <div className={styles.acoes}>
                    <button
                      className={styles.btnVisualizar}
                      onClick={() => handleViewClick(sub.submissao_id)}
                      disabled={viewingId === sub.submissao_id || updatingId === sub.submissao_id}
                    >
                      {viewingId === sub.submissao_id ? '...' : 'Visualizar'}
                    </button>

                    <button 
                      className={styles.btnAnalisar}
                      onClick={() => {
                        setEditMode('pendente');
                        setEditingItem(sub);
                      }}
                      disabled={updatingId === sub.submissao_id || viewingId === sub.submissao_id}
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
            {publicacoes.map((pub) => (
              <tr key={pub.submissao_id}>
                <td data-label="Título:">
                  {pub.titulo_proposto}
                </td>
                <td data-label="Autor:">
                  {pub.autor || '—'}
                </td>
                <td data-label="Tipo:">
                  {pub.tipo ? pub.tipo.toUpperCase() : '—'}
                </td>
                <td data-label="Ano:">
                  {pub.ano_publicacao || pub.ano_defesa || '—'}
                </td>
                <td data-label="Ações:">
                  <div className={styles.acoes}>
                    {/* 👇 Novo botão de Visualizar, igual ao da aba Pendentes */}
                    <button
                      className={styles.btnVisualizar}
                      onClick={() => handleViewClick(pub.submissao_id)}
                      disabled={viewingId === pub.submissao_id || updatingId === pub.submissao_id}
                    >
                      {viewingId === pub.submissao_id ? '...' : 'Visualizar'}
                    </button>

                    <button
                      className={styles.btnAnalisar}
                      onClick={() => {
                        setEditMode('gerenciar');
                        setEditingItem(pub);
                      }}
                      disabled={updatingId === pub.submissao_id || viewingId === pub.submissao_id}
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
  // = RENDER PRINCIPAL
  // ==========================================
  return (
    <>
      <div className={styles.container}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Painel Bibliotecário</h1>
<<<<<<< Updated upstream
            <button className="btn-publicar">Nova Publicação</button>
            <p>Abaixo estão as submissões que estão pendentes para análise.</p>
          </div>
=======
            <p>
              {abaAtiva === 'pendentes'
                ? 'Abaixo estão as submissões que estão pendentes para análise.'
                : 'Gerencie as informações das publicações já aprovadas no acervo.'}
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
            </div>
          </div>

          <button 
            className={styles.btnAprovarModal}
            onClick={() => setIsUploadModalOpen(true)}
            style={{ height: 'fit-content' }}
          >
            Publicar Novo
          </button>
>>>>>>> Stashed changes
        </div>

        {/* Conteúdo condicional conforme a aba */}
        {abaAtiva === 'pendentes' ? renderPendentes() : renderGerenciar()}
      </div>

      {/* Modal de Edição (compartilhado entre as abas) */}
      {editingItem && (
        <EditModal 
          mode={editMode}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaveAndApprove={handleAprovar}    // usado no modo 'pendente'
          onReprove={handleReprovar}          // usado no modo 'pendente'
          onUpdateOnly={(updated) => {        // usado no modo 'gerenciar'
            setPublicacoes(prev =>
              prev.map(p =>
                p.submissao_id === updated.submissao_id ? { ...p, ...updated } : p
              )
            );
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
