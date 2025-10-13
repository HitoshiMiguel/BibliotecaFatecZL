// Arquivo: src/components/Header.jsx
'use client';

import Image from 'next/image';
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

  // A tag <header> agora só tem o className global
  return (
    <header className="app-header">
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
          {/* ... outros ícones ... */}
            <a href="#" className="govsp">/governosp</a>        
        </div>
      </div>

      {/* Faixa CPS/Fatec */}
      <div className="CPS-header">
        <div className="CPS-container">
          <div className="logos">
            <Image src="/imagens/logo-fatec-cps.png" alt="Logo Fatec e CPS" width={300} height={80} className="logo-cps-fatec-img" />
          </div>
          <div className={styles.dynamicSlot}>
            {pathname === '/' || pathname === '/siteFatec' ? <SearchBar /> : <HamburgerMenu />}
          </div>
        </div>
      </div>
    </header>
  );
}