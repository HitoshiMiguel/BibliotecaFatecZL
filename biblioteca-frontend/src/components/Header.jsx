// Arquivo: src/components/Header.jsx
'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

// hook do menu global
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';

/* ===========================
   Componentes visuais do topo
   =========================== */

const SearchBar = () => (
  <div className={styles.searchBar}>
    <input
      type="search"
      className={styles.campoDeBusca}
      placeholder="O que deseja localizar?"
      aria-label="Buscar no site"
    />
    <button className={styles.btnSearch} aria-label="Buscar">
      <i className="bi bi-search"></i>
    </button>
  </div>
);

/* ===========================================
   Botão de Menu (3 barrinhas vermelhas)
   - usa useGlobalMenu internamente
   - sem texto, só as barras
   - estilos inline pra não depender de CSS extra
   =========================================== */
const HamburgerMenu = () => {
  const { openMenu } = useGlobalMenu();

  const btnStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: 34,           // largura do ícone
    height: 24,          // altura total do ícone
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    alignItems: 'flex-start'
  };

  const barStyle = {
    display: 'block',
    width: '100%',
    height: 4,           // espessura das barrinhas
    backgroundColor: '#b20000', // vermelho Fatec
    borderRadius: 2
  };

  return (
    <button
      type="button"
      onClick={openMenu}
      aria-haspopup="dialog"
      aria-controls="global-menu"
      aria-label="Abrir menu"
      style={btnStyle}
    >
      <span style={barStyle} />
      <span style={barStyle} />
      <span style={barStyle} />
    </button>
  );
};

export default function Header() {
  const pathname = usePathname();

  // Define --header-offset com a altura real do header fixo
  useEffect(() => {
    const setHeaderOffset = () => {
      const headerEl =
        document.querySelector('.app-header') ||
        document.querySelector('header[role="banner"]') ||
        document.querySelector('header');

      const h = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--header-offset', `${h}px`);
    };

    setHeaderOffset();
    window.addEventListener('resize', setHeaderOffset);
    const t1 = setTimeout(setHeaderOffset, 250);
    const t2 = setTimeout(setHeaderOffset, 800);
    return () => {
      window.removeEventListener('resize', setHeaderOffset);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <header className="app-header" role="banner">
      {/* Skip link global (visível ao focar via teclado) */}
      <a href="#page-content" className="skip-link">Pular para o conteúdo</a>

      {/* Faixa Governo */}
      <div className="govsp-header">
        <div className="logo-governo">
          <Image
            src="/imagens/logo-governo.png"
            alt="Logo Governo de SP"
            width={200}
            height={38}
            priority
          />
        </div>
        <div className="icones">
          <a href="#"><Image src="/imagens/i-flickr.png" alt="Flickr" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-linkedin.png" alt="Linkedin" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-tiktok.png" alt="TikTok" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-youtube.png" alt="YouTube" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-twitter.png" alt="Twitter" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-instagram.png" alt="Instagram" width={25} height={25} /></a>
          <a href="#"><Image src="/imagens/i-facebook.png" alt="Facebook" width={25} height={25} /></a>
          <a href="#" className="govsp">/governosp</a>
        </div>
      </div>

      {/* Faixa CPS/Fatec */}
      <div className="CPS-header">
        <div className="CPS-container">
          <div className="logos">
            <Image
              src="/imagens/logo-fatec-cps.png"
              alt="Logo Fatec e CPS"
              width={300}
              height={80}
              className="logo-cps-fatec-img"
            />
          </div>

          {/* Slot dinâmico à direita: busca (home) OU botão Menu (demais páginas) */}
          <div className={styles.dynamicSlot}>
            {(pathname === '/' || pathname === '/siteFatec')
              ? <SearchBar />
              : <HamburgerMenu /> }
          </div>
        </div>
      </div>
    </header>
  );
}
