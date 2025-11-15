import React from 'react';

// Este componente não renderiza nada visível.
// Ele apenas "injeta" as definições de filtro SVG na página
// para que o CSS (filter: url(...)) possa encontrá-las.
export default function AccessibilityFiltersSVG() {
  return (
    <div style={{ position: 'absolute', height: 0, width: 0, overflow: 'hidden' }}>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          {/* Deuteranopia (Verde-fraco) */}
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0, 0, 0,
                      0.7, 0.3, 0, 0, 0,
                      0, 0.3, 0.7, 0, 0,
                      0, 0, 0, 1, 0"
            />
          </filter>
          {/* Protanopia (Vermelho-fraco) */}
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0, 0, 0,
                      0.558, 0.442, 0, 0, 0,
                      0, 0.242, 0.758, 0, 0,
                      0, 0, 0, 1, 0"
            />
          </filter>
          {/* Tritanopia (Azul-fraco) */}
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