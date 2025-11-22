// src/components/FavoritosModal.jsx
'use client';

import Link from 'next/link';
import styles from './FavoritosModal.module.css';
import { BsBoxArrowUpRight, BsX } from 'react-icons/bs';

export default function FavoritosModal({ isOpen, onClose, favoritos = [] }) {
  if (!isOpen) return null;

  const handleModalClick = (e) => e.stopPropagation();

  // --- FUNÇÃO PARA CORRIGIR CARACTERES ESTRANHOS ---
  // Tenta converter a bagunça de caracteres (ex: CÃ³digo) de volta para UTF-8 (Código)
  const fixEncoding = (text) => {
    if (!text) return '';
    try {
      return decodeURIComponent(escape(text));
    } catch (e) {
      return text; // Se der erro na conversão, devolve o original
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={handleModalClick}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>Meus Itens Favoritos</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fechar modal">
            <BsX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {favoritos.length === 0 ? (
            <p className={styles.emptyText}>Você ainda não favoritou nenhum item.</p>
          ) : (
            <ul className={styles.list}>
              {favoritos.map((item, index) => {
                
                // 1. BUSCA O ID CORRETO
                const idFinal = item.id_visualizacao || item.item_id || item.submissao_id || item.id_favorito;
                
                // 2. DETECTA SE É FÍSICO OU DIGITAL
                const isFisico = (item.origem === 'FISICO') || 
                                 (typeof idFinal === 'string' && idFinal.includes('LEGACY'));

                // 3. GERA O LINK
                const linkHref = idFinal ? `/consulta/${idFinal}` : '#';
                
                // 4. KEY ÚNICA
                const uniqueKey = idFinal || `fav-${index}`;

                // 5. CORRIGE O TÍTULO
                const tituloCorrigido = fixEncoding(item.titulo || item.titulo_proposto);

                return (
                  <li key={uniqueKey} className={styles.listItem}>
                    
                    <Link 
                      href={linkHref} 
                      className={styles.link}
                      onClick={(e) => {
                        if (!idFinal) e.preventDefault();
                        else onClose();
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                         <span className={styles.linkText}>
                            {tituloCorrigido || 'Item sem título'}
                         </span>
                         
                         {/* --- BADGES --- */}
                         {isFisico ? (
                            // Badge Físico (Cinza)
                            <span style={{ 
                              fontSize: '0.7em', 
                              color: '#555', 
                              border: '1px solid #ccc', 
                              padding: '1px 6px', 
                              borderRadius: '4px',
                              backgroundColor: '#f0f0f0',
                              whiteSpace: 'nowrap',
                              fontWeight: '500'
                            }}>
                              Físico
                            </span>
                         ) : (
                            // Badge Digital (Azulzinho)
                            <span style={{ 
                              fontSize: '0.7em', 
                              color: '#555', 
                              border: '1px solid #ccc', 
                              padding: '1px 6px', 
                              borderRadius: '4px',
                              backgroundColor: '#f0f0f0',
                              whiteSpace: 'nowrap',
                              fontWeight: '500'
                            }}>
                              Digital
                            </span>
                         )}
                      </div>

                      <BsBoxArrowUpRight className={styles.linkIcon} />
                    </Link>

                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}