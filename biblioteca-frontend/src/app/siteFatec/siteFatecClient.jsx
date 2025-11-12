'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import styles from './siteFatec.module.css';
import { useGlobalMenu } from '@/components/GlobalMenu/GlobalMenuProvider';

/* ==========================
   Notícias – estilo Fatec
   ========================== */
function NoticiasCPS() {
  const NEWS = [
    { id: 1, img: '/images/biblio-acervo1.jpg', title: 'Biblioteca da Fatec ZL recebe novos títulos no acervo digital', date: '28 de outubro de 2025', href: '#', excerpt: 'Foram adicionados mais de 300 novos e-books e periódicos acadêmicos, ampliando as possibilidades de pesquisa dos alunos.' },
    { id: 2, img: '/images/biblio-leitura.jpg', title: 'Projeto incentiva leitura com clube de livros e rodas de conversa', date: '22 de outubro de 2025', href: '#', excerpt: 'A iniciativa busca estimular o hábito da leitura entre os estudantes, com encontros mensais e curadoria do corpo docente.' },
    { id: 3, img: '/images/biblio-renovacao.jpg', title: 'Sistema de empréstimo e renovação online é modernizado', date: '18 de outubro de 2025', href: '#', excerpt: 'A nova interface do sistema permite solicitar empréstimos e renovar obras diretamente pelo site da biblioteca.' },
    { id: 4, img: '/images/biblio-exposicao.jpg', title: 'Exposição celebra o Dia Nacional do Livro na Fatec ZL', date: '15 de outubro de 2025', href: '#', excerpt: 'Com o tema “O livro como ponte para o conhecimento”, a mostra reuniu obras raras e interativas no saguão da biblioteca.' },
  ];

  return (
    <section id="noticias" className={styles.newsSection} aria-labelledby="noticiasTitulo">
      <div className={styles.newsHeader}>
        <h2 id="noticiasTitulo" className={styles.newsTitle}>Últimas notícias sobre a Biblioteca</h2>
        <span className={styles.newsUnderline} aria-hidden="true" />
      </div>

      <div className={styles.newsGrid}>
        {NEWS.map((n) => (
          <article key={n.id} className={styles.newsCard}>
            <a href={n.href} className={styles.newsLink}>
              <div className={styles.newsThumbWrap}>
                <img className={styles.newsThumb} src={n.img} alt="" loading="lazy" />
              </div>
              <div className={styles.newsCardBody}>
                <h3 className={styles.newsCardTitle}>{n.title}</h3>
                {n.excerpt ? <p className={styles.newsExcerpt}>{n.excerpt}</p> : null}
                <time className={styles.newsDate}>{n.date}</time>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ==========================================
   PÁGINA CLIENT – Biblioteca Fatec Online
   ========================================== */
export default function SiteFatecPage() {
  const { isAuthed, logout } = useGlobalMenu();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    document.title = 'Site Fatec Online - Biblioteca Fatec ZL';
  }, []);

  // calcula a altura do header
  useEffect(() => {
    const setHeaderOffset = () => {
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

  // filtro de acessibilidade
  useEffect(() => {
    const saved = localStorage.getItem('colorFilter') || 'normal';
    document.documentElement.setAttribute('data-cf', saved);
  }, []);
  function handleChangeColorFilter(e) {
    const v = e.target.value;
    document.documentElement.setAttribute('data-cf', v);
    localStorage.setItem('colorFilter', v);
  }

  return (
    <>
      <div id="top-anchor" aria-hidden="true" />

      {/* ⬅️ REMOVIDO o skip-link duplicado daqui */}

      <div className={styles.topBarsWrapper}>
        <div className={styles.topRedBar} role="navigation" aria-label="Navegação rápida">
          <Container className={styles.tabsContainer}>
            <ul className={styles.tabsList}>
              <li><a href="#noticias" className={styles.tab}>Notícias</a></li>
              <li><a href="#eventos" className={styles.tab}>Eventos</a></li>
              <li><a href="#acervo" className={styles.tab}>Acervo</a></li>
              <li><a href="#servicos" className={styles.tab}>Serviços</a></li>
            </ul>

            {/* Botão dinâmico: Entrar / Sair */}
            <div className={styles.authArea}>
              {isAuthed ? (
                <button onClick={logout} className={styles.profileBtn} aria-label="Sair da conta">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M16 13v-2H7V8l-5 4l5 4v-3zM20 3H8v2h12v14H8v2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                  </svg>
                  <span className={styles.profileText}>Sair</span>
                </button>
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
            Acesse o acervo, solicite materiais e acompanhe eventos e notícias da biblioteca.
          </p>
          <nav aria-label="Ações principais">
            <a href="/consulta" className={styles.primaryBtn}>Consulte o acervo online</a>
            <a href="/uploadForm" className={styles.ghostBtn}>Solicitação para a biblioteca</a>
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
              <span className={styles.badge}>Acervo Digital • Fatec ZL</span>
              <p className={styles.aboutText}>
                A Biblioteca da Fatec Zona Leste apoia ensino, pesquisa e extensão, oferecendo
                empréstimo de materiais, consulta ao acervo físico e digital, orientação em
                normalização (ABNT) e um espaço acolhedor para estudo.
              </p>
              <ul className={styles.aboutBullets}>
                <li>Empréstimo e renovação online</li>
                <li>Consulta ao <strong>acervo</strong> e reservas</li>
                <li>Guia rápido de normalização ABNT</li>
              </ul>
              <div className={styles.aboutActions}>
                <a href="/sobre" className={styles.ghostBtn}>Conheça o espaço</a>
                <a href="/regulamento" className={styles.primaryBtn}>Regulamento</a>
              </div>
            </div>

            <div className={styles.aboutRight}>
              <div className={styles.stat}><div className={styles.statNumber}>12k+</div><div className={styles.statLabel}>títulos cadastrados</div></div>
              <div className={styles.stat}><div className={styles.statNumber}>25k+</div><div className={styles.statLabel}>exemplares</div></div>
              <div className={styles.stat}><div className={styles.statNumber}>ABNT</div><div className={styles.statLabel}>apoio à normalização</div></div>
            </div>
          </section>

          {/* Acesso rápido */}
          <section className={styles.quickLinks}>
            <h3 className={styles.sectionHeading}>Acesso rápido</h3>
            <ul className={styles.quickGrid}>
              <li><a className={styles.quickItem} href="/acervo"><span className={styles.qText}>Consultar Acervo</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/solicitacao-material"><span className={styles.qText}>Solicitar Material</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/eventos"><span className={styles.qText}>Eventos e Palestras</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/noticias"><span className={styles.qText}>Notícias da Biblioteca</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/tutorial"><span className={styles.qText}>Guias e Tutoriais</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/duvidas-frequentes"><span className={styles.qText}>Dúvidas Frequentes</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/regulamento"><span className={styles.qText}>Regulamento</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/contato"><span className={styles.qText}>Fale com a Biblioteca</span><span className={styles.qGo} aria-hidden>›</span></a></li>
              <li><a className={styles.quickItem} href="/sobre"><span className={styles.qText}>Sobre a Biblioteca</span><span className={styles.qGo} aria-hidden>›</span></a></li>
            </ul>
          </section>

          <NoticiasCPS />
        </main>
      </Container>

      {/* Rodapé institucional */}
      <footer className={styles.govFooter}>
        <div className={styles.govFooterInner}>
          <div className={styles.govLeft}>
            <div className={styles.govAccessibility}>
              <span className={styles.govFilterLabel}>FILTRO DE DALTONISMO</span>
              <select className={styles.govSelect} onChange={handleChangeColorFilter}>
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
            <button className={styles.govBtnColor} aria-label="Acessibilidade" title="Acessibilidade">◎</button>
          </div>
        </div>
      </footer>
    </>
  );
}




