'use client';

import React, { useEffect } from 'react';

/**
 * Componente VLibrasWidget (Reestruturado para Injeção do Elemento VLibras)
 * - Injeta a <div> oficial que o script VLibras espera.
 * - Cria a função global para chamar a API de toggle interna do VLibras (window.vw.toggleWidget).
 */
export default function VLibrasWidget() {
  useEffect(() => {
    // 1. URLs e IDs
    const vlibrasScriptUrl = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    const vlibrasInitId = 'vlibras-init-script';
    const vlibrasContainerId = 'vlibras-wrapper-container';

    // Flag de controle para evitar múltiplas injeções de script
    if (document.getElementById(vlibrasInitId) || window.__VLIBRAS_INIT_SCRIPT_LOADED__) {
      // Se o script já foi injetado, garante que a função de toggle exista.
      if (!window.toggleVLibrasMenu) {
        window.toggleVLibrasMenu = createToggleFunction();
      }
      return;
    }

    window.__VLIBRAS_INIT_SCRIPT_LOADED__ = true;
    console.info('[VLibras] Iniciando injeção de script e container...');


    // --- 2. Cria e anexa o container de ativação que o VLibras procura ---
    
    // A biblioteca VLibras busca por um elemento <div vw class="enabled">
    let container = document.getElementById(vlibrasContainerId);
    if (!container) {
        container = document.createElement('div');
        container.id = vlibrasContainerId;
        // Adiciona a div de ativação que o script do VLibras busca: <div vw class="enabled">...
        container.innerHTML = `
            <div vw class="enabled">
                <div vw-access-button class="active"></div>
                <div vw-plugin-wrapper>
                    <div class="vw-plugin-top-wrapper"></div>
                </div>
            </div>
        `;
        // Esconde o container do fluxo de layout, pois queremos usar o nosso próprio botão.
        container.style.cssText = 'position: absolute; top: -1000px; left: -1000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(container);
    }
    
    
    // --- 3. Função de Ativação Manual Global ---
    const createToggleFunction = () => {
        return () => {
            if (window.vw && typeof window.vw.toggleWidget === 'function') {
                // Tenta usar a API oficial do VLibras para abrir/fechar
                window.vw.toggleWidget();
                console.log('[VLibras Manual] Chamando API oficial: window.vw.toggleWidget().');
            } else {
                // Se a API não estiver pronta, tenta clicar no botão interno (fallback)
                const vwButton = document.querySelector('.vw-access-button');
                if (vwButton) {
                    vwButton.click();
                    console.log('[VLibras Manual] Usando fallback: Botão VLibras clicado.');
                } else {
                    console.warn('[VLibras Manual] API e Fallback do botão falharam. Verifique se o script carregou corretamente.');
                }
            }
        };
    };
    window.toggleVLibrasMenu = createToggleFunction();

    
    // --- 4. Injeta o script principal do VLibras ---
    const script = document.createElement('script');
    script.src = vlibrasScriptUrl;
    script.id = vlibrasInitId;
    script.async = true;

    script.onload = () => {
        console.info('[VLibras] Script carregado. O widget deve inicializar automaticamente.');
        // O script deve inicializar automaticamente ao encontrar a div 'vw'.
        // Não precisamos do 'new VLibras.Widget' aqui.
    };

    script.onerror = (e) => console.error('[VLibras] Erro fatal ao carregar script:', e);
    
    document.body.appendChild(script);

    // Limpeza na desmontagem do componente
    return () => {
      delete window.toggleVLibrasMenu;
      // Mantemos o script e o wrapper no DOM, pois o VLibras deve ser global para o site.
    };
  }, []);

  return null;
}