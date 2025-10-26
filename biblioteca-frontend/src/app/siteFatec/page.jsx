// NOVO FICHEIRO: app/siteFatec/page.jsx (Server Component)

import SiteFatecClient from './siteFatecClient'; // Importa o componente com 'use client'

// Exporta os metadados para esta rota específica
export const metadata = {
  // Define o título que será usado na renderização inicial do servidor
  title: 'Site Fatec Online', 
  // O template no layout.jsx raiz (se existir) pode adicionar "| Biblioteca Fatec ZL"
};

// A função default da página apenas renderiza o componente cliente
export default function SiteFatecPage() {
  return <SiteFatecClient />;
}