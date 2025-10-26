// app/confirmar-conta/page.jsx (Componente Servidor Corrigido)

import ConfirmarContaClient from './confirmarContaClient'; // Importa o componente cliente
import React from 'react'; // Necessário para JSX

// Exporta os metadados (título da guia)
export const metadata = {
  title: 'Confirmação de Conta | Biblioteca Fatec ZL', // Título completo
};

// A função default da página APENAS renderiza o componente cliente
export default function ConfirmarContaPage() {
    // Certifique-se de que o nome aqui é EXATAMENTE igual ao da importação (maiúsculas/minúsculas)
    return <ConfirmarContaClient />; 
}