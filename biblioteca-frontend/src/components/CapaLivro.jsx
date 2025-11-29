'use client';

import React, { useState } from 'react';

export default function CapaLivro({ publicacaoId }) {
  const [erro, setErro] = useState(false);

  if (!publicacaoId) return null;

  // --- GARANTIA DE FUNCIONAMENTO ---
  // Vimos no teste que sua API roda em localhost:4000 e tem prefixo /api.
  // Vamos fixar isso aqui para não ter erro de variável de ambiente por enquanto.
  const API_BASE = 'http://localhost:4000/api';
  
  const urlCapa = `${API_BASE}/publicacoes/capa/${publicacaoId}`;

  if (erro) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#f0f0f0', 
        color: '#999', 
        fontSize: '0.7rem',
        textAlign: 'center',
        padding: 5
      }}>
        Sem Capa
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', position: 'relative' }}>
      <img 
        src={urlCapa}
        alt="Capa da publicação"
        onError={(e) => {
            console.error("Erro ao carregar capa:", urlCapa);
            setErro(true);
        }}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover'
        }}
        loading="lazy"
      />
    </div>
  );
}