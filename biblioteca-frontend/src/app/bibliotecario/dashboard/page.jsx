// src/app/bibliotecario/dashboard/page.jsx
'use client'; 

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // 1. Importar o SweetAlert
import styles from './dashboard-bibliotecario.module.css';

// URL da sua API (Backend na porta 4000)
const API_URL = 'http://localhost:4000';

export default function DashboardBibliotecarioPage() {
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. Novo estado para saber qual item está a ser atualizado
  const [updatingId, setUpdatingId] = useState(null);

  // 3. Função para buscar os dados (como antes)
  useEffect(() => {
    async function getSubmissoesPendentes() {
      try {
        const res = await fetch(`${API_URL}/api/admin/submissoes/pendentes`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError('Não autorizado. Faça login novamente.');
          } else {
            setError('Falha ao buscar dados do servidor.');
          }
          throw new Error('Falha na requisição');
        }

        const data = await res.json();
        setSubmissoes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getSubmissoesPendentes();
  }, []); 

  // 4. Nova função: handleAprovar
  const handleAprovar = async (id) => {
    setUpdatingId(id); // Desativa os botões deste item

    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${id}/aprovar`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Falha ao aprovar');
      }

      // Sucesso
      Swal.fire('Aprovado!', 'A submissão foi aprovada com sucesso.', 'success');
      // Remove o item da lista na tela
      setSubmissoes(submissoes.filter((sub) => sub.submissao_id !== id));

    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setUpdatingId(null); // Reativa os botões
    }
  };

  // 5. Nova função: handleReprovar
  const handleReprovar = async (id) => {
    // Pergunta de confirmação
    const result = await Swal.fire({
      title: 'Tem a certeza?',
      text: "A submissão será rejeitada e o arquivo apagado do Google Drive. Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, reprovar!',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return; // Não faz nada se o bibliotecário cancelar
    }

    // Se confirmou...
    setUpdatingId(id); // Desativa os botões

    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${id}/reprovar`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao reprovar');
      }

      // Sucesso
      Swal.fire('Reprovado!', 'A submissão foi reprovada e o arquivo apagado.', 'success');
      // Remove o item da lista na tela
      setSubmissoes(submissoes.filter((sub) => sub.submissao_id !== id));

    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setUpdatingId(null); // Reativa os botões
    }
  };

  // 6. Lógica de renderização (como antes)
  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Painel de Moderação</h1>
        <p>A carregar submissões...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>Painel de Moderação</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Painel de Moderação</h1>
      <p>Abaixo estão as submissões a aguardar aprovação.</p>

      {submissoes.length === 0 ? (
        <p>Nenhuma submissão pendente no momento.</p>
      ) : (
        <table className={styles.tabelaSubmissoes}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Enviado por</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {submissoes.map((sub) => (
              <tr key={sub.submissao_id}>
                <td>{sub.titulo_proposto}</td>
                <td>{sub.nome_remetente}</td>
                <td>
                  {new Date(sub.data_submissao).toLocaleDateString('pt-BR')}
                </td>
                <td className={styles.acoes}>
                  {/* 7. BOTÕES ATUALIZADOS com onClick e disabled */}
                  <button 
                    className={styles.btnAprovar}
                    onClick={() => handleAprovar(sub.submissao_id)}
                    disabled={updatingId === sub.submissao_id} // Desativa se estiver a atualizar este
                  >
                    {updatingId === sub.submissao_id ? '...' : 'Aprovar'}
                  </button>
                  <button 
                    className={styles.btnReprovar}
                    onClick={() => handleReprovar(sub.submissao_id)}
                    disabled={updatingId === sub.submissao_id} // Desativa se estiver a atualizar este
                  >
                    {updatingId === sub.submissao_id ? '...' : 'Reprovar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}