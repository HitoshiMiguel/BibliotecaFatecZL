// src/app/bibliotecario/dashboard/page.jsx
'use client'; 

import { useState, useEffect } from 'react'; // Removi 'useMemo' daqui, pois ele só era usado no modal
import Swal from 'sweetalert2';

// 1. IMPORTE O CSS DA PÁGINA
import styles from './dashboard-bibliotecario.module.css'; 

// 2. IMPORTE O NOSSO NOVO COMPONENTE DE MODAL
import { EditModal } from './MyEditModal.jsx';
import { NewUploadModal } from './NewUploadModal';

// URL da sua API (Backend na porta 4000)
const API_URL = 'http://localhost:4000';

// ====================================================================
// = PÁGINA PRINCIPAL DO DASHBOARD (COM A LÓGICA DE VOLTA)
// ====================================================================
export default function DashboardBibliotecarioPage() {
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // Para desativar botões na linha
  const [editingItem, setEditingItem] = useState(null); // Para saber qual item abrir no modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Controla o modal de upload
  const [viewingId, setViewingId] = useState(null);

  const handleUploadComplete = (novoItemAprovado) => {
    console.log('Novo item publicado:', novoItemAprovado);
    setIsUploadModalOpen(false);
  }
  // ==========================================
  // = LÓGICA DE BUSCAR DADOS (RESTAU-RADA)
  // ==========================================
  useEffect(() => {
    async function getSubmissoesPendentes() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/submissoes/pendentes`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) setError('Não autorizado. Faça login novamente.');
          else setError('Falha ao buscar dados do servidor.');
          throw new Error('Falha na requisição');
        }
        
        const data = await res.json();
        
        // AQUI ESTÁ A CORREÇÃO IMPORTANTE:
        setSubmissoes(data || []); // Usamos || [] para evitar 'null'
        
      } catch (err) {
        console.error(err);
        // Se der erro na busca, garantimos que submissoes é um array
        setSubmissoes([]); 
      } finally {
        setLoading(false);
      }
    }
    getSubmissoesPendentes();
  }, []); // O array vazio [] garante que isso roda só uma vez

  // ==========================================
  // = LÓGICA DOS BOTÕES (RESTAU-RADA)
  // ==========================================
  
  // Função para APROVAR (chamada pelo modal)
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
      // Remove o item da lista na tela
      setSubmissoes(submissoes.filter((sub) => sub.submissao_id !== id));
    
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
      setUpdatingId(null); 
    }
    // Não precisa de 'finally' aqui, pois o item aprovado já sumiu do modal
  };

  // Função para REPROVAR (chamada pelo modal)
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

    if (!result.isConfirmed) return; // Se cancelar, não faz nada

    setUpdatingId(id); 
    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${id}/reprovar`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao reprovar');
      
      Swal.fire('Reprovado!', 'A submissão foi reprovada e o arquivo apagado.', 'success');
      // Remove o item da lista na tela
      setSubmissoes(submissoes.filter((sub) => sub.submissao_id !== id));
    
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
      setUpdatingId(null); 
    }
  };

  // --- ADICIONE ESTA FUNÇÃO ---
const handleViewClick = async (submissaoId) => {
  if (viewingId === submissaoId) return; // Já está carregando
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
      // Abre o link do Google Drive em uma nova aba
      window.open(data.webViewLink, '_blank', 'noopener,noreferrer');
    } else {
      throw new Error('Link de visualização não encontrado.');
    }

  } catch (err) {
    Swal.fire('Erro', err.message, 'error');
  } finally {
    setViewingId(null); // Termina o loading
  }
};

  // ==========================================
  // = RENDERIZAÇÃO DA PÁGINA (COM LOADING/ERRO)
  // ==========================================

  // Lógica de renderização (Loading / Erro)
  const renderContent = () => {
    if (loading) {
      return <p>A carregar submissões...</p>;
    }
    
    if (error) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }
    
    if (submissoes.length === 0) {
      return <p>Nenhuma submissão pendente no momento.</p>;
    }

    // Se tudo estiver OK, renderiza a tabela:
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
            {submissoes.map((sub) => (
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
                  <div className={styles.acoes}> {/* Garante que .acoes é flex, veja CSS abaixo */}

                    {/* --- BOTÃO NOVO --- */}
                    <button
                      className={styles.btnVisualizar} // Usaremos um estilo novo
                      onClick={() => handleViewClick(sub.submissao_id)}
                      disabled={viewingId === sub.submissao_id || updatingId === sub.submissao_id}
                    >
                      {viewingId === sub.submissao_id ? '...' : 'Visualizar'}
                    </button>

                    {/* --- BOTÃO ANTIGO --- */}
                    <button 
                      className={styles.btnAnalisar}
                      onClick={() => setEditingItem(sub)}
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

  // --- RENDERIZAÇÃO PRINCIPAL (HTML DA PÁGINA) ---
  return (
    <>
      <div className={styles.container}>
        {/* 4. ATUALIZE O CABEÇALHO DA PÁGINA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Painel Bibliotecário</h1>
            <button className="btn-publicar">Nova Publicação</button>
            <p>Abaixo estão as submissões que estão pendentes para análise.</p>
          </div>
        </div>

        {/* Aqui renderiza a lógica (Loading, Erro, Tabela ou Vazio) */}
        {renderContent()}
        
      </div> 

      {/* O Modal de Edição (que já existia) */}
      {editingItem && (
        <EditModal 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaveAndApprove={handleAprovar}
          onReprove={handleReprovar}
        />
      )}

      {/* 5. ADICIONE O NOVO MODAL DE UPLOAD */}
      {isUploadModalOpen && (
        <NewUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </> 
  );
}