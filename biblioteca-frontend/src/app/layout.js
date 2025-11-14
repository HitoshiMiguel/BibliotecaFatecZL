// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import 'sweetalert2/dist/sweetalert2.min.css';

// ✅ Provider global do menu e o widget de acessibilidade (VLibras)
import GlobalMenuProvider from "@/components/GlobalMenu/GlobalMenuProvider";
import VLibrasWidget from "@/components/Accessibility/VLibrasWidget";

// 🆕 Importação do novo Provedor de Acessibilidade (Daltonismo)
import { AccessibilityProvider } from '@/components/Accessibility/AccessibilityProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Biblioteca Fatec Zona Leste",
  description: "Portal da Biblioteca - Fatec Zona Leste",
};

export default function RootLayout({ children }) {
  // ATENÇÃO: A remoção de qualquer espaço em branco, nova linha ou comentário
  // entre a tag `<html>` e a tag `<body>` é CRUCIAL para evitar o erro de hidratação
  // que estava aparecendo no seu console.
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Adiciona o link para o Font Awesome para o ícone de busca no Header */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLMDJc5fS5tJ+sT2Zc0v/V1FfXvGvF4I6F3B1+2R9T3F4I8O6I2o8I3uK7g1xG5Q=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        />
      </head>

      <body>
        {/* 🔗 Skip link para leitores de tela */}
        <a href="#page-content" className="skip-link">
          Pular para o conteúdo
        </a>
        
        {/* ⚙️ NOVO: Provider de Acessibilidade (Daltonismo e filtros visuais) */}
        <AccessibilityProvider>

          {/* 🌐 Provider global para o menu lateral e contexto geral */}
          <GlobalMenuProvider>
            {/* 🔝 Cabeçalho fixo institucional */}
            {/* O Header está fixo com z-40 e a main precisa de um padding top para compensar. */}
            <Header />

            {/* 📚 Conteúdo principal das páginas */}
            <main
              id="page-content"
              role="main"
              aria-label="Conteúdo principal"
              className="page-content pt-[70px]" 
            >
              {children}
            </main>
          </GlobalMenuProvider>

          {/* 🧏‍♂️ Widget VLibras para acessibilidade em Libras */}
          {/* Note: O VLibrasWidget deve ficar fora do GlobalMenuProvider para evitar
              dependências desnecessárias e para ser injetado diretamente no <body> */}
          <VLibrasWidget />

        </AccessibilityProvider>
      </body>
    </html>
  );
}