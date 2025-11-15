'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback 
} from 'react';

// 1. Criar o Contexto
const AccessibilityContext = createContext(null);

// 2. Criar o "Provider" (o componente que envolve)
export function AccessibilityProvider({ children }) {
  // O estado do filtro que será "visto" pelo React
  const [currentFilter, setCurrentFilter] = useState('normal');

  // Efeito que roda uma vez no início (no cliente)
  // para carregar o filtro salvo do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('colorFilter') || 'normal';
    document.documentElement.setAttribute('data-cf', saved);
    setCurrentFilter(saved);
  }, []); // '[]' = Roda só na primeira vez

  // Função para mudar o filtro
  const handleChangeColorFilter = useCallback((e) => {
    // 'e' pode ser o evento do select (e.target.value) ou só o valor
    const v = typeof e === 'string' ? e : e.target.value;
    
    document.documentElement.setAttribute('data-cf', v);
    localStorage.setItem('colorFilter', v);
    setCurrentFilter(v);
  }, []);

  // O valor que será "provido" para os componentes filhos
  const value = {
    currentFilter,
    handleChangeColorFilter,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// 3. Criar o "Hook" (para os componentes usarem)
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de um AccessibilityProvider');
  }
  return context;
};