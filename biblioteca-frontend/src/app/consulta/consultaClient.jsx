'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './consulta.module.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ConsultaClient() {
  const [campoBusca, setCampoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [items, setItems] = useState([]);

<<<<<<< Updated upstream
  // --- Estado para Favoritos (SÓ VISUAL) ---
  const [favoritos, setFavoritos] = useState([]); // Guarda os IDs [1, 5, 22]

  // Função de busca original (sem alterações)
  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const url = `${API}/publicacoes?q=${encodeURIComponent(campoBusca.trim())}`;
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

  // --- Função de "Clique Falso" (SÓ VISUAL) ---
  const handleToggleFavorito = (submissaoId) => {
    // 1. Limpa qualquer erro antigo (como o "Erro ao atualizar...")
    setErro(''); 
=======
  // 👇 NOVO: saber se já pesquisou alguma vez
  const [jaPesquisou, setJaPesquisou] = useState(false);

  // ============================================================
  // 1️⃣ Carregar TODAS as publicações quando abrir a página
  // ============================================================
  useEffect(() => {
    async function carregarTudo() {
      try {
        const res = await fetch(`${API}/publicacoes`, {
          cache: 'no-store'
        });
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
      }
    }

    carregarTudo();
  }, []);

  // ============================================================
  // 2️⃣ Pesquisa manual (quando o usuário envia o form)
  // ============================================================
  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    setJaPesquisou(true);  // agora ele sabe que o usuário pesquisou

    try {
      const url = `${API}/publicacoes?q=${encodeURIComponent(campoBusca.trim())}`;
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
        <button type="submit" className={styles.searchButton} aria-label="Buscar">
          🔍︎
        </button>
      </form>
>>>>>>> Stashed changes

    // 2. Lógica de toggle puramente visual
    setFavoritos(prevFavoritos => {
      const isFavorito = prevFavoritos.includes(submissaoId);
      if (isFavorito) {
        return prevFavoritos.filter(id => id !== submissaoId); // Remove
      } else {
        return [...prevFavoritos, submissaoId]; // Adiciona
      }
    });
  };

<<<<<<< Updated upstream
  return (
    <main className={styles.pageContainer}>
      <h1 className={styles.title}>Bem-vindo à Biblioteca Online</h1>

      <form className={styles.searchForm} role="search" aria-label="Formulário de busca" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="O que deseja pesquisar?"
          id="search-input"
          aria-label="Campo de busca"
          value={campoBusca}
          onChange={(e) => setCampoBusca(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} aria-label="Buscar">
          🔍︎
        </button>
      </form>

      {carregando && <p className={styles.metaInfo}>Pesquisando…</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      {/* EMPTY STATE */}
      {!carregando && !erro && items.length === 0 && (
        <div className={styles.emptyBox} aria-live="polite">
          <div className={styles.emptyEmoji}>🗒️😕</div>
          <h2 className={styles.emptyTitle}>Nenhum resultado encontrado para a sua pesquisa.</h2>
          <p className={styles.emptyText}>
            Gostaria de adicionar o item ao acervo digital da biblioteca?{' '}
            <Link className={styles.link} href="/uploadForm">clique aqui</Link>
          </p>
        </div>
      )}

      {/* LISTA DE RESULTADOS */}
      {items.length > 0 && (
        <ul className={styles.resultList} role="list">
          {items.map((it) => {
            
            // Usamos o 'it.submissao_id' (que sabemos que existe)
            const isFavorito = favoritos.includes(it.submissao_id);

            return (
              <li key={it.submissao_id} className={styles.resultItem}>
                
                <Link href={`/consulta/${it.submissao_id}`} className={styles.resultLink}>
                  <h3 className={styles.resultTitle}>{it.titulo_proposto}</h3>
                  <p className={styles.resultMeta}>
                    {it.autor ? `${it.autor}. ` : ''}
                    {it.editora ? `${it.editora}, ` : ''}
                    {it.ano_publicacao || it.ano_defesa ? (it.ano_publicacao || it.ano_defesa) : 's/d'}.
                  </p>
                </Link>

        _       {/* Botão de Favorito (SÓ VISUAL) */}
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    handleToggleFavorito(it.submissao_id); 
                  }}
                  className={styles.favoritoButton}
                  aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  {isFavorito ? (
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
=======
      {/* ============================================================
          3️⃣ Empty state só aparece se o usuário pesquisou
          ============================================================ */}
      {!carregando && !erro && jaPesquisou && items.length === 0 && (
        <div className={styles.emptyBox} aria-live="polite">
          <div className={styles.emptyEmoji}>🗒️😕</div>
          <h2 className={styles.emptyTitle}>Nenhum resultado encontrado.</h2>
          <p className={styles.emptyText}>
            Quer adicionar um item ao acervo?{' '}
            <Link className={styles.link} href="/uploadForm">clique aqui</Link>
          </p>
        </div>
      )}

      {/* ============================================================
          4️⃣ Lista de resultados SEMPRE aparece se houver itens
          ============================================================ */}
      {items.length > 0 && (
        <ul className={styles.resultList} role="list">
          {items.map((it) => (
            <li key={it.submissao_id} className={styles.resultItem}>
              <Link href={`/consulta/${it.submissao_id}`} className={styles.resultLink}>
                <h3 className={styles.resultTitle}>{it.titulo_proposto}</h3>
                <p className={styles.resultMeta}>
                  {it.autor ? `${it.autor}. ` : ''}
                  {it.editora ? `${it.editora}, ` : ''}
                  {it.ano_publicacao || it.ano_defesa
                    ? (it.ano_publicacao || it.ano_defesa)
                    : 's/d'}.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
>>>>>>> Stashed changes
