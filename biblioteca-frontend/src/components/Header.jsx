// Arquivo: src/components/Header.jsx
'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const SearchBar = () => (
  <div className={styles.searchBar}>
    <input type="search" className={styles.campoDeBusca} placeholder="O que deseja localizar?" />
    <button className={styles.btnSearch} aria-label="Buscar">
      <i className="bi bi-search"></i>
    </button>
  </div>
);

const HamburgerMenu = () => (
  <div><span style={{ color: '#888' }}>Menu</span></div>
);

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
      // console.log('[header] height:', h);
    };

    setHeaderOffset();
    window.addEventListener('resize', setHeaderOffset);
    const t1 = setTimeout(setHeaderOffset, 250);
    const t2 = setTimeout(setHeaderOffset, 800);
    return () => {
      window.removeEventListener('resize', setHeaderOffset);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, []);

  return (
    <header className="app-header">
      {/* Skip link global (fora do fluxo; aparece só ao focar) */}
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>

      {/* Faixa Governo */}
      <div className="govsp-header">
        <div className="logo-governo">
          <Image src="/imagens/logo-governo.png" alt="Logo Governo de SP" width={200} height={38} priority />
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
          <div className={styles.dynamicSlot}>
            {pathname === '/' || pathname === '/siteFatec' ? <SearchBar /> : <HamburgerMenu />}
          </div>
        </div>
      </div>
    </header>
  );
}
