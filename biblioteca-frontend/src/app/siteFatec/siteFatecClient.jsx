'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import styles from './siteFatec.module.css';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';
import { useAccessibility } from '@/components/Accessibility/AccessibilityProvider';

/* ==========================================
   PÁGINA CLIENT – Biblioteca Fatec Online
   ========================================== */
export default function SiteFatecPage() {
  const { isAuthed, logout, user } = useGlobalMenu();
  const [showTop, setShowTop] = useState(false);

  // 1. ESTADOS PARA OS NÚMEROS DO BANCO
  const [stats, setStats] = useState({
    totalTitulos: 0,
    itensDigitais: 0,
    livrosFisicos: 0
  });

  // 2. BUSCAR DADOS NO BACKEND
  useEffect(() => {
    async function fetchStats() {
      try {
        // ⚠️ ATENÇÃO À PORTA: Verifique se seu backend roda na 5000, 3001, etc.
        // Se no app.js estiver app.use('/api/acervo'...), mude para /api/acervo/stats
        const response = await fetch('http://localhost:4000/api/acervo/stats'); 
        
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalTitulos: data.totalTitulos || 0,
            itensDigitais: data.itensDigitais || 0,
            livrosFisicos: data.livrosFisicos || 0
          });
        } else {
          console.error("Erro na resposta da API:", response.status);
        }
      } catch (error) {
        console.error("Erro ao conectar com o backend:", error);
        // Se der erro (servidor desligado), mantém 0 ou coloca valores de fallback
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    document.title = 'Site Fatec Online - Biblioteca Fatec ZL';
  }, []);

  // calcula a altura do header
  useEffect(() => {
    const setHeaderOffset = () => {
      /** @type {HTMLElement | null} */
      const headerEl = document.querySelector('.app-header');
      const h = headerEl?.offsetHeight || 0;
      document.documentElement.style.setProperty('--header-offset', `${h}px`);
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

  // mostra o botão de voltar ao topo
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBackToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const { currentFilter, handleChangeColorFilter } = useAccessibility();

  let profileHref = '/dashboard'; // ou '/perfil' (Padrão para aluno/comum)
  let profileLabel = 'Perfil';

  if (user?.role === 'admin') {
    profileHref = '/admin/dashboard';
    profileLabel = 'Perfil';
  } else if (user?.role === 'bibliotecario') {
    profileHref = '/bibliotecario/dashboard';
    profileLabel = 'Perfil';
  }

  return (
    <>
      <div id="top-anchor" aria-hidden="true" />

      <div className={styles.topBarsWrapper}>
        <div className={styles.topRedBar} role="navigation" aria-label="Navegação rápida">
          <Container className={styles.tabsContainer}>
            <div className={styles.authArea}>
              {isAuthed ? (
                <>
                  {/* --- NOVO BOTÃO DE PERFIL --- */}
                  <Link href={profileHref} className={styles.profileBtn} aria-label={`Ir para ${profileLabel}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
                    </svg>
                    <span className={styles.profileText}>{profileLabel}</span>
                  </Link>

                  {/* --- BOTÃO DE SAIR (JÁ EXISTENTE) --- */}
                  <button onClick={logout} className={styles.profileBtn} aria-label="Sair da conta">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M16 13v-2H7V8l-5 4l5 4v-3zM20 3H8v2h12v14H8v2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                    </svg>
                    <span className={styles.profileText}>Sair</span>
                  </button>
                </>
              ) : (
                <Link href="/login" className={styles.profileBtn} aria-label="Ir para a tela de login">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
                  </svg>
                  <span className={styles.profileText}>Entrar</span>
                </Link>
              )}
            </div>
          </Container>
          
        </div>

        <div className={styles.crumbBar} role="navigation" aria-label="Breadcrumb">
          <div className={styles.crumbContainer}>
            <a className={styles.crumbHome} href="/"><span>Home</span></a>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>Acervo Digital</span>
          </div>
        </div>
      </div>

      {/* HERO */}
      <header className={styles.hero} role="img" aria-label="Estudantes na biblioteca - imagem de destaque">
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Biblioteca Online da Fatec Zona Leste</h1>
          <p className={styles.heroLead}>
            Acesse o acervo, solicite materiais e faça reservas de forma rápida e prática.
          </p>
          <nav aria-label="Ações principais">
            <Link href="/consulta" className={styles.primaryBtn}>Consulte o acervo online</Link>
            <Link href="/uploadForm" className={styles.ghostBtn}>Solicitação para a biblioteca</Link>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO */}
      <Container id="main-content" className={styles.pageContainer}>
        <main className={styles.mainContent} role="main" aria-labelledby="home-title">
          <h2 id="home-title" className={styles.sectionTitle}>Biblioteca Online</h2>

          {/* Sobre a Biblioteca */}
          <section className={styles.aboutLib}>
            <div className={styles.aboutLeft}>
              <span className={styles.badge}>Acervo Híbrido • Fatec Zona Leste</span>
              <p className={styles.aboutText}>
                A nova plataforma da Biblioteca Fatec ZL transforma a maneira como você estuda. 
                Integramos o acervo tradicional a uma moderna biblioteca digital, oferecendo acesso instantâneo a livros, TCCs e artigos. 
                Tenha autonomia para gerenciar seus empréstimos e pesquisar materiais de qualquer lugar.
              </p>
              <ul className={styles.aboutBullets}>
                <li><strong>Acervo Híbrido</strong>: Consulte livros físicos e baixe materiais digitais.</li>
                <li><strong>Autoatendimento:</strong>Renove e reserve títulos sem filas.</li>
              </ul>
            </div>

            {/* 3. ESTATÍSTICAS DINÂMICAS */}
            <div className={styles.aboutRight}>
              
              {/* Total de Títulos */}
              <div className={styles.stat}>
                <div className={styles.statNumber}>
                  {stats.totalTitulos > 0 ? stats.totalTitulos : '...'}
                </div>
                <div className={styles.statLabel}>Total de itens</div>
              </div>

              {/* Itens Digitais */}
              <div className={styles.stat}>
                <div className={styles.statNumber}>
                  {stats.itensDigitais > 0 ? stats.itensDigitais : '...'}
                </div>
                <div className={styles.statLabel}>Itens digitais</div>
              </div>

              {/* Livros Físicos */}
              <div className={styles.stat}>
                <div className={styles.statNumber}>
                  {stats.livrosFisicos > 0 ? stats.livrosFisicos : '...'}
                </div>
                <div className={styles.statLabel}>Livros físicos</div>
              </div>

            </div>
          </section>

          {/* Acesso rápido */}
          <section className={styles.quickLinks}>
            <h3 className={styles.sectionHeading}>Acesso rápido</h3>
            <ul className={styles.quickGrid}>
              <li><a className={styles.quickItem} href="/consulta"><span className={styles.qText}>Consultar Acervo</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/uploadForm"><span className={styles.qText}>Solicitar Material</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/login"><span className={styles.qText}>Login</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/duvidas-frequentes"><span className={styles.qText}>Dúvidas Frequentes</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/contato"><span className={styles.qText}>Fale com a Biblioteca</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/sobre"><span className={styles.qText}>Sobre a Biblioteca</span><span className={styles.qGo} aria-hidden>›</span></a></li>
            </ul>
          </section>
        </main>
      </Container>

      {/* Rodapé institucional */}
      <footer className={styles.govFooter}>
        <div className={styles.govFooterInner}>
          <div className={styles.govLeft}>
            <div className={styles.govAccessibility}>
              <span className={styles.govFilterLabel}>FILTRO DE DALTONISMO</span>
              <select 
                className={styles.govSelect} 
                onChange={handleChangeColorFilter}
                value={currentFilter}
              >
                <option value="normal">Cores Padrão</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="protanopia">Protanopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </div>
          </div>
          <div className={styles.govCenter}>
            <img src="/images/logo-govsp.png" alt="Governo do Estado de São Paulo" className={styles.govLogo} />
          </div>
          <div className={styles.govRight}>
            <button
              className={styles.govBtnUp}
              aria-label="Voltar ao topo"
              title="Voltar ao topo"
              onClick={handleBackToTop}
              data-show={showTop}
            >
              ↑
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}