'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './consulta.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ConsultaClient() {
  const [campoBusca, setCampoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [items, setItems] = useState([]);

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
          {items.map((it) => (
            <li key={it.submissao_id} className={styles.resultItem}>
              <Link href={`/consulta/${it.submissao_id}`} className={styles.resultLink}>
                <h3 className={styles.resultTitle}>{it.titulo_proposto}</h3>
                <p className={styles.resultMeta}>
                  {it.autor ? `${it.autor}. ` : ''}
                  {it.editora ? `${it.editora}, ` : ''}
                  {it.ano_publicacao || it.ano_defesa ? (it.ano_publicacao || it.ano_defesa) : 's/d'}.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
