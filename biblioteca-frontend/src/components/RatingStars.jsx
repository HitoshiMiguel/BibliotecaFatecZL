// src/components/RatingStars.jsx
'use client';

import { useState, useEffect } from 'react';
import styles from './RatingStars.module.css'; // O erro no chat acontece aqui, mas no seu PC vai funcionar
import { api } from '@/services/api';          // O erro no chat acontece aqui, mas no seu PC vai funcionar

export default function RatingStars({ itemId, publicacaoId, onRatingChange, tipo = 'digital' }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Define qual ID usar (compatibilidade)
  const idEfetivo = itemId || publicacaoId;

  // Busca avaliações reais do servidor
  useEffect(() => {
    const fetchAvaliacoes = async () => {
      if (!idEfetivo) return;

      try {
        setLoading(true);
        // Usa a API real passando o tipo na URL
        const res = await api(`/api/publicacoes/${idEfetivo}/avaliacoes?tipo=${tipo}`);
        
        if (res?.ok) {
          setUserRating(res.data.userRating);
          setAverage(res.data.average);
          setCount(res.data.count);
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (err?.status === 401) {
          setIsAuthenticated(false);
        } else {
          // Se não for 401, assume autenticado (ex: erro de rede)
          setIsAuthenticated(true); 
        }
        console.error('[RatingStars] Erro ao buscar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvaliacoes();
  }, [idEfetivo, tipo]);

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      setError('Você precisa estar logado para avaliar');
      return;
    }

    try {
      setError(null);
      
      // Envia para o backend real com o tipo na URL e no Body
      const res = await api(`/api/publicacoes/${idEfetivo}/avaliar?tipo=${tipo}`, {
        method: 'POST',
        body: JSON.stringify({ nota: rating, tipo: tipo })
      });
      
      if (res?.ok) {
        setUserRating(rating);
        setAverage(res.data.average);
        setCount(res.data.count);
        if (onRatingChange) onRatingChange(rating);
      }
    } catch (err) {
      console.error('[RatingStars] Erro ao salvar:', err);
      if (err?.status === 401) setError('Faça login para avaliar');
      else setError('Erro ao salvar avaliação');
    }
  };

  if (loading) return <div className={styles.container}>Carregando...</div>;
  if (!idEfetivo) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Avaliação</h3>
      </div>

      <div className={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            // Aplica as classes do CSS Module
            className={`${styles.star} ${
              (hoverRating || userRating || 0) >= star ? styles.active : ''
            }`}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={!isAuthenticated}
            type="button"
            title={isAuthenticated ? `Avaliar com ${star} estrela(s)` : 'Faça login para avaliar'}
          >
            ★
          </button>
        ))}
      </div>

      {userRating !== null && (
        <div className={styles.userRating}>
          Sua avaliação: <strong>{userRating} estrela(s)</strong>
        </div>
      )}

      <div className={styles.stats}>
        <span className={styles.average}>
          {typeof average === 'number' ? average.toFixed(1) : '0.0'}
        </span>
        <span className={styles.count}>
          ({count} avaliação{count !== 1 ? 'ões' : ''})
        </span>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      {!isAuthenticated && !error && (
        <div className={styles.info}>Faça login para avaliar</div>
      )}
    </div>
  );
}