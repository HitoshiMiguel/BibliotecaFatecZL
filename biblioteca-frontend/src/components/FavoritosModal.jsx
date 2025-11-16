// src/components/FavoritosModal.jsx
'use client';

import Link from 'next/link';
import styles from './FavoritosModal.module.css';
import { BsBoxArrowUpRight, BsX } from 'react-icons/bs';

export default function FavoritosModal({ isOpen, onClose, favoritos = [] }) {
  if (!isOpen) {
    return null;
  }

  // Previne que o clique no modal feche o modal (só o overlay fecha)
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    // O Overlay (fundo escuro) que fecha ao clicar
    <div className={styles.overlay} onClick={onClose}>
      
      {/* O Conteúdo do Modal */}
      <div className={styles.modal} onClick={handleModalClick}>
        
        {/* Cabeçalho */}
        <div className={styles.header}>
          <h2 className={styles.title}>Meus Itens Favoritos</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fechar modal">
            <BsX size={24} />
          </button>
        </div>

        {/* Lista de Favoritos */}
        <div className={styles.content}>
          {favoritos.length === 0 ? (
            <p className={styles.emptyText}>Você ainda não favoritou nenhum item.</p>
          ) : (
            <ul className={styles.list}>
              {favoritos.map((item) => (
                <li key={item.item_id} className={styles.listItem}>
                  
                  {/* Link clicável que leva para a página de detalhes */}
                  <Link 
                    href={`/consulta/${item.submissao_id}`} 
                    className={styles.link}
                    onClick={onClose} // Fecha o modal ao clicar no link
                  >
                    <span className={styles.linkText}>{item.titulo}</span>
                    <BsBoxArrowUpRight className={styles.linkIcon} />
                  </Link>

                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}