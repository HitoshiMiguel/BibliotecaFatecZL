import React from 'react';

// ESTE CÓDIGO AGORA TEM VERSÕES INTENSAS PARA AMBOS OS FILTROS RED/GREEN
export default function AccessibilityFiltersSVG() {
  return (
    <div style={{ position: 'absolute', height: 0, width: 0, overflow: 'hidden' }}>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          {/* Deuteranopia (Cegueira ao Verde) - VERSÃO INTENSA
             Observe que a linha 1 e a linha 2 são IDÊNTICAS.
             Isso força o vermelho e o verde a virarem a mesma "cor de burro quando foge".
          */}
          <filter id="deuteranopia">
             <feColorMatrix
               type="matrix"
               // R  G    B  A  Offset
               values="0.7, 0.3, 0, 0, 0,
                       0.7, 0.3, 0, 0, 0,
                       0,   0,   1, 0, 0,
                       0,   0,   0, 1, 0"
             />
          </filter>

          {/* Protanopia (Cegueira ao Vermelho) - VERSÃO INTENSA (Que você já tinha gostado)
          */}
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.2, 0.8, 0, 0, 0,
                      0.2, 0.8, 0, 0, 0,
                      0, 0, 1, 0, 0,
                      0, 0, 0, 1, 0"
            />
          </filter>

          {/* Tritanopia (Cegueira ao Azul) - Mantido igual */}
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05, 0, 0, 0,
                      0, 0.433, 0.567, 0, 0,
                      0, 0.475, 0.525, 0, 0,
                      0, 0, 0, 1, 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}