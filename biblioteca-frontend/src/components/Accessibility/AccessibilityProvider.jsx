'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Mapeamento dos filtros de visão de cores para aplicar via CSS.
 * A chave é o valor que será armazenado no estado e exibido no menu.
 * O valor é o filtro CSS que anula a cor correspondente.
 */
const COLOR_BLINDNESS_FILTERS = {
  'padrao': 'none',
  'deuteranopia': 'url("#deuteranopia")',
  'protanopia': 'url("#protanopia")',
  'tritanopia': 'url("#tritanopia")',
};

// 1. Criação do Contexto
const AccessibilityCtx = createContext({
  colorBlindnessFilter: 'padrao',
  setColorBlindnessFilter: () => {},
});

// Hook customizado para usar o contexto
export const useAccessibility = () => useContext(AccessibilityCtx);

/**
 * 2. Provedor de Contexto
 * Gerencia o estado do filtro de cor e o aplica ao <body> do documento.
 */
export function AccessibilityProvider({ children }) {
  // Inicializa o filtro a partir do localStorage para manter a preferência do usuário
  const [colorBlindnessFilter, setColorBlindnessFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('colorBlindnessFilter') || 'padrao';
    }
    return 'padrao';
  });

  // 3. Aplica o filtro CSS ao <body> e salva no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const filterValue = COLOR_BLINDNESS_FILTERS[colorBlindnessFilter] || 'none';
      
      // Aplica o filtro ao corpo para afetar todo o conteúdo
      document.body.style.filter = filterValue === 'none' ? 'none' : `grayscale(0) ${filterValue}`;
      
      // Salva a preferência
      localStorage.setItem('colorBlindnessFilter', colorBlindnessFilter);
      
      // Nota: o filtro CSS real é definido dentro de um SVG (veja o componente abaixo)
    }
  }, [colorBlindnessFilter]);

  const value = {
    colorBlindnessFilter,
    setColorBlindnessFilter,
    filterOptions: Object.keys(COLOR_BLINDNESS_FILTERS),
  };

  return (
    <AccessibilityCtx.Provider value={value}>
      {children}
      {/* 4. Componente que define os filtros SVG (deve ser renderizado uma vez no DOM) */}
      <SVGColorBlindnessFilters />
    </AccessibilityCtx.Provider>
  );
}

/**
 * Componente que injeta as definições de filtro SVG (Colour-Matrix) no DOM.
 * Estes filtros são referenciados pela propriedade 'filter: url(#...)'.
 */
const SVGColorBlindnessFilters = () => (
  // O SVG deve ser escondido do layout, mas presente no DOM para o CSS referenciá-lo.
  <svg style={{ position: 'absolute', height: 0, width: 0, overflow: 'hidden' }}>
    <defs>
      {/* A matriz de cor (Color Matrix) é o método padrão WCAG para simular/corrigir deficiências de cor.
        Os valores abaixo são as matrizes usadas para correção/simulação de daltonismo. 
        Fonte: W3C/MDN e estudos de acessibilidade (e.g., DaltonLens, HCL).
      */}
      
      {/* Deuteranopia (Vermelho/Verde - Falha no Verde) */}
      <filter id="deuteranopia">
        <feColorMatrix
          type="matrix"
          values="0.625 0.375 0 0 0
                  0.7 0.3 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0"
        />
      </filter>

      {/* Protanopia (Vermelho/Verde - Falha no Vermelho) */}
      <filter id="protanopia">
        <feColorMatrix
          type="matrix"
          values="0.446 0.554 0 0 0
                  0.24 0.76 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0"
        />
      </filter>
      
      {/* Tritanopia (Azul/Amarelo - Falha no Azul) */}
      <filter id="tritanopia">
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0
                  0 0.933 0.067 0 0
                  0 0.473 0.527 0 0
                  0 0 0 1 0"
        />
      </filter>
    </defs>
  </svg>
);