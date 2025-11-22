'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './consulta.module.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg'; // [NOVO] Para um loading no coração

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


export default function ConsultaClient() {
  const [campoBusca, setCampoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [items, setItems] = useState([]);
  const [jaPesquisou, setJaPesquisou] = useState(false);

  // --- Estados de Favoritos ---
  
  // [MODIFICADO] Este estado agora será preenchido pelo banco de dados
  const [favoritos, setFavoritos] = useState([]); // array de submissao_id
  
  // [NOVO] Estado para saber qual coração está "carregando"
  const [loadingFavoritoId, setLoadingFavoritoId] = useState(null);

  // ============================================================
  // 1️⃣ Carregar TODAS as publicações quando abrir a página
  // ============================================================
  useEffect(() => {
    async function carregarPublicacoes() {
      try {
        const res = await fetch(`${API}/api/publicacoes`, {
          cache: 'no-store',
        });
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        // Não trava a página se publicações falharem
      }
    }
    carregarPublicacoes();
  }, []);

  // ============================================================
  // [NOVO] 2️⃣ Carregar os FAVORITOS REAIS do usuário
  // ============================================================
  useEffect(() => {
    async function carregarFavoritos() {

      try {
        const res = await fetch(`${API}/api/favoritos`, {
          credentials: 'include', // Envia cookies para autenticação
          cache: 'no-store',
        });

        if (!res.ok) {
          console.warn('Não foi possível carregar favoritos: ');
          setFavoritos([]); // Define como vazio
          return;
        }

        // O backend retorna um array de IDs: [1, 5, 22]
        const data = await res.json();
        setFavoritos(data);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err.message);
        // Não definimos um erro 'fatal' aqui, o usuário ainda pode navegar
      }
    }

    carregarFavoritos();
  }, []); // Roda apenas uma vez quando o componente monta

  // ============================================================
  // 3️⃣ Pesquisa manual (quando o usuário envia o form)
  // ============================================================
  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    setJaPesquisou(true);

    try {
      const url = `${API}/api/publicacoes?q=${encodeURIComponent(
        campoBusca.trim()
      )}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) throw new Error('Falha ao consultar publicações.');

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setErro(err.message || 'Erro inesperado.');
      setItems([]);
    } finally {
      setCarregando(false);
    }
  }

  // ============================================================
  // [MODIFICADO] 4️⃣ Toggle de favorito (AGORA COM API)
  // ============================================================
  const handleToggleFavorito = async (idAlvo) => {
    if (!idAlvo) return; // Segurança

    setErro(''); 
    setLoadingFavoritoId(idAlvo);

    const isFavorito = favoritos.includes(idAlvo);
    
    // Se já é favorito, DELETE. Se não, POST.
    const url = isFavorito
      ? `${API}/api/favoritos/${idAlvo}`
      : `${API}/api/favoritos`;

    const method = isFavorito ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        // Se for POST, enviamos o ID no corpo
        body: isFavorito ? null : JSON.stringify({ itemId: idAlvo }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert('Você precisa estar logado para favoritar itens.');
          return;
        }
        const errData = await res.json();
        throw new Error(errData.message || 'Erro ao atualizar favorito.');
      }

      // Atualiza estado local
      if (isFavorito) {
        setFavoritos((prev) => prev.filter((id) => id !== idAlvo));
      } else {
        setFavoritos((prev) => [...prev, idAlvo]);
      }

    } catch (err) {
      console.error(err);
      setErro(err.message);
    } finally {
      setLoadingFavoritoId(null);
    }
  }

  return (
    <main className={styles.pageContainer}>
      <h1 className={styles.title}>Acervo Digital</h1>

      <form
        className={styles.searchForm}
        role="search"
        aria-label="Formulário de busca"
        onSubmit={onSubmit}
      >
        <input
          type="text"
          placeholder="O que deseja pesquisar?"
          id="search-input"
          aria-label="Campo de busca"
          value={campoBusca}
          onChange={(e) => setCampoBusca(e.target.value)}
          className={styles.searchInput}
        />
        <button
          type="submit"
          className={styles.searchButton}
          aria-label="Buscar"
        >
          🔍︎
        </button>
      </form>

      {carregando && <p className={styles.metaInfo}>Pesquisando…</p>}
      {/* [MODIFICADO] Mostra o erro de favorito se ele existir */}
      {erro && <p className={styles.erro}>{erro}</p>}

      {/* ... (empty state) ... */}
      {!carregando && !erro && jaPesquisou && items.length === 0 && (
         <div className={styles.emptyBox} aria-live="polite">
          <div className={styles.emptyEmoji}>🗒️😕</div>
          <h2 className={styles.emptyTitle}>
             Nenhum resultado encontrado para a sua pesquisa.
           </h2>
           <p className={styles.emptyText}>
             Gostaria de adicionar o item ao acervo digital da biblioteca?{' '}
             <Link className={styles.link} href="/uploadForm">
               clique aqui
             </Link>
           </p>
         </div>
       )}

      {/* ============================================================
           Lista de resultados
           ============================================================ */}
      {items.length > 0 && (
        <ul className={styles.resultList}>
          {items.map((it) => {
            // --- LÓGICA CRÍTICA ---
            // Se origem for FISICO, o ID é 'submissao_id'. 
            // Se for DIGITAL, o ID é 'item_id'.
            const idParaFavoritar = it.origem === 'FISICO' ? it.submissao_id : it.item_id;

            const isFavorito = favoritos.includes(idParaFavoritar);
            const isCarregandoFav = loadingFavoritoId === idParaFavoritar;

            return (
              <li key={it.submissao_id} className={styles.resultItem}>
                <Link href={`/consulta/${it.submissao_id}`} className={styles.resultLink}>
                  <h3 className={styles.resultTitle}>{it.titulo_proposto}</h3>
                  <p className={styles.resultMeta}>
                    {it.autor ? `${it.autor}. ` : ''}
                    {it.editora ? `${it.editora}, ` : ''}
                    {it.ano_publicacao || it.ano_defesa || 's/d'}.
                    
                    {/* Badge visual opcional para identificar itens físicos */}
                    {it.origem === 'FISICO' && (
                        <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#666', border: '1px solid #ccc', padding: '0 4px', borderRadius: '4px'}}>
                            Físico
                        </span>
                    )}
                  </p>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isCarregandoFav) {
                      // Passamos o ID correto (Físico ou Digital)
                      handleToggleFavorito(idParaFavoritar);
                    }
                  }}
                  className={styles.favoritoButton}
                  disabled={isCarregandoFav}
                  title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isCarregandoFav ? (
                    <CgSpinner size={20} className={styles.spinner} />
                  ) : isFavorito ? (
                    <FaHeart size={20} style={{ color: 'var(--cor-primaria-red, #D93025)' }} />
                  ) : (
                    <FaRegHeart size={20} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

/**
 * [NOVO] Adicione esta classe ao seu consulta.module.css 
 * para fazer o spinner girar
 * .spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

 */