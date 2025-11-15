// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'sweetalert2/dist/sweetalert2.min.css';
import Script from 'next/script';

// IMPORTS PRINCIPAIS
import GlobalMenuProvider from "@/components/GlobalMenu/GlobalMenuProvider";
import { AccessibilityProvider } from '@/components/Accessibility/AccessibilityProvider';
import AccessibilityFiltersSVG from '@/components/Accessibility/AccessibilityFiltersSVG';
import Header from '@/components/Header';

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
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>

      <body>
        <a href="#page-content" className="skip-link">
          Pular para o conteúdo
        </a>

        <GlobalMenuProvider>
          <AccessibilityProvider>
            <AccessibilityFiltersSVG />
            <Header />

            <main
              id="page-content"
              role="main"
              aria-label="Conteúdo principal"
              className="page-content"
            >
              {children}
            </main>
          </AccessibilityProvider>
        </GlobalMenuProvider>

        {/* UserWay */}
        <Script
          src="https://cdn.userway.org/widget.js"
          data-account="2W0cmD9xlq"
          strategy="lazyOnload"
        />

        {/* VLibras – HTML estático igual à documentação */}
        <div
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              <div vw class="enabled">
                <div vw-access-button class="active"></div>
                <div vw-plugin-wrapper>
                  <div class="vw-plugin-top-wrapper"></div>
                </div>
              </div>
              <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
              <script>
                new window.VLibras.Widget('https://vlibras.gov.br/app');
              </script>
            `,
          }}
        />
      </body>
    </html>
  );
}
