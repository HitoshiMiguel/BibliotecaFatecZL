'use client';
import { useState } from 'react';
import styles from './consulta.module.css'; // A conexão já está aqui

export default function ConsultaPage() {
  const [campoBusca, setCampoBusca] = useState('');

  return (
    // Usamos a tag <main> e aplicamos a classe .pageContainer
    <main className={styles.pageContainer}>

      {/* Usamos a tag <h1> e aplicamos a classe .title */}
      <h1 className={styles.title}>Bem-vindo à Biblioteca Online</h1>

      <form
        className={styles.searchForm}
        role="search"
        aria-label="Formulário de busca"
      >
        <input
          type="text"
          placeholder="O que deseja pesquisar?"
          id="search-input"
          aria-label="Campo de busca"
          value={campoBusca}
          onChange={(e) => setCampoBusca(e.target.value)}
          className={styles.searchInput} // Aplicamos a classe específica do input
        />
        <button
          type="submit"
          className={styles.searchButton}
          aria-label="Buscar"
        >
          🔍︎
        </button>
      </form>
    </main>
  );
}