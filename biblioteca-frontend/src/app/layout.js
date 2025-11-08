// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import 'sweetalert2/dist/sweetalert2.min.css';

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
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Skip link para acessibilidade (visível ao focar via teclado) */}
        <a href="#page-content" className="skip-link">Pular para o conteúdo</a>

        {/* Header FIXO */}
        <Header />

        {/* Conteúdo da página */}
        <main id="page-content" role="main" aria-label="Conteúdo principal" className="page-content">
          {children}
        </main>
      </body>
    </html>
  );
}