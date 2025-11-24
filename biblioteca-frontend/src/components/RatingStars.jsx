// src/components/RatingStars.jsx
'use client';

import { useState, useEffect } from 'react';
import styles from './RatingStars.module.css';
import { api } from '@/services/api';

export default function RatingStars({ itemId, publicacaoId, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);

  // Verifica se é um item legado (LEGACY_xxx)
  useEffect(() => {
    setIsLegacy(String(publicacaoId || itemId).startsWith('LEGACY_'));
  }, [publicacaoId, itemId]);

  // Busca avaliações ao montar
  useEffect(() => {
    const fetchAvaliacoes = async () => {
      try {
        setLoading(true);
        console.log('[RatingStars] Buscando avaliações. itemId:', itemId, 'isLegacy:', isLegacy);
        
        const res = await api(`/api/publicacoes/${itemId}/avaliacoes`);
        if (res?.ok) {
          setUserRating(res.data.userRating);
          setAverage(res.data.average);
          setCount(res.data.count);
          // Se conseguiu fazer a requisição, está autenticado (mesmo que userRating seja null)
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Se receber 401, usuário não autenticado
        if (err?.status === 401) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true); // Assume autenticado se for outro erro
        }
        console.error('[RatingStars] Erro ao buscar avaliações:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvaliacoes();
  }, [itemId]);

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      // Usuário não autenticado
      setError('Você precisa estar logado para avaliar');
      return;
    }

    try {
      setError(null);
      console.log('[RatingStars] Enviando avaliação:', { itemId, nota: rating });
      
      const res = await api(`/api/publicacoes/${itemId}/avaliar`, {
        method: 'POST',
        body: JSON.stringify({ nota: rating })
      });
      
      console.log('[RatingStars] Resposta:', res);
      
      if (res?.ok) {
        setUserRating(rating);
        setAverage(res.data.average);
        setCount(res.data.count);
        if (onRatingChange) onRatingChange(rating);
      }
    } catch (err) {
      console.error('[RatingStars] Erro ao salvar avaliação:', err);
      
      if (err?.status === 401) {
        setError('Você precisa estar logado para avaliar');
      } else if (err?.status === 404) {
        setError('Publicação não encontrada');
      } else {
        setError(err?.message || 'Erro ao salvar avaliação');
      }
    }
  };

  if (loading) {
    return <div className={styles.container}>Carregando avaliações...</div>;
  }

  // Itens legados não podem ser avaliados
  if (isLegacy) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Avaliação</h3>
        </div>
        <div className={styles.info}>
          Avaliações não estão disponíveis para itens do acervo físico
        </div>
      </div>
    );
  }

  // Se não tem itemId válido, não renderiza
  if (!itemId) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Avaliação</h3>
      </div>

      {/* Estrelas para avaliar */}
      <div className={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${styles.star} ${
              (hoverRating || userRating) >= star ? styles.active : ''
            }`}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={!isAuthenticated}
            title={isAuthenticated ? `Avaliar com ${star} estrela(s)` : 'Faça login para avaliar'}
          >
            ★
          </button>
        ))}
      </div>

      {/* Sua avaliação */}
      {userRating !== null && (
        <div className={styles.userRating}>
          Sua avaliação: <strong>{userRating} estrela(s)</strong>
        </div>
      )}

      {/* Média e contagem */}
      <div className={styles.stats}>
        <span className={styles.average}>{average.toFixed(1)}</span>
        <span className={styles.count}>({count} avaliação{count !== 1 ? 'ões' : ''})</span>
      </div>

      {/* Mensagem de erro */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Mensagem para não autenticados */}
      {!isAuthenticated && !error && (
        <div className={styles.info}>Faça login para avaliar este item</div>
      )}
    </div>
  );
}
