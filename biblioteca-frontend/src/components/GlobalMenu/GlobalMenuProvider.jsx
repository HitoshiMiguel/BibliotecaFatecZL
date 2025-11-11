'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './globalMenu.module.css';

/* ============================
   Contexto e Hook Global
============================ */
const Ctx = createContext(null);
export const useGlobalMenu = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalMenu must be used inside <GlobalMenuProvider>');
  return ctx;
};

/* ============================
   Provider Principal
============================ */
export default function GlobalMenuProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen(v => !v), []);

  // Controla scroll e tecla ESC quando o menu está aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, closeMenu]);

  return (
    <Ctx.Provider value={{ open, openMenu, closeMenu, toggleMenu }}>
      {children}
      <GlobalMenuSheet />
    </Ctx.Provider>
  );
}

/* ============================
   Menu Lateral (Sheet)
============================ */
function GlobalMenuSheet() {
  const { open, closeMenu } = useGlobalMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  // URLs do backend (ajustadas para /api/auth)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const LOGOUT_URL = `${API_URL}/api/auth/logout`;

  /* ============================
     Verifica se o usuário está logado
  ============================= */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(AUTH_CHECK_URL, {
          method: 'GET',
          credentials: 'include', // envia cookies
        });
        setIsAuthed(res.ok); // true se 200 OK
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setIsAuthed(false);
      }
    };

    checkAuth();

    // Atualiza se ocorrer login/logout em outras abas
    window.addEventListener('auth:changed', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('auth:changed', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, [AUTH_CHECK_URL]);

  /* ============================
     Logout do usuário
  ============================= */
  const handleLogout = useCallback(async () => {
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
    setIsAuthed(false);
    closeMenu();
    router.push('/login');
  }, [LOGOUT_URL, closeMenu, router]);

  if (typeof document === 'undefined') return null;

  /* ============================
     Links do menu
  ============================= */
  const baseLinks = [
    { href: '/siteFatec', label: 'Home', icon: '🏠' },
    { href: '/consulta', label: 'Consulta', icon: '🔎' },
    { href: '/acervo', label: 'Acervo', icon: '📚' },
    { href: '/eventos', label: 'Eventos', icon: '📅' },
    { href: '/servicos', label: 'Serviços', icon: '🧰' },
  ];

  const authAction = isAuthed
    ? { type: 'button', onClick: handleLogout, label: 'Sair', icon: '🚪' }
    : { type: 'link', href: '/login', label: 'Entrar', icon: '👤' };

  /* ============================
     Renderização do Menu
  ============================= */
  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-open={open}
        onClick={closeMenu}
        aria-hidden
      />
      <aside
        className={styles.sheet}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-menu-title"
      >
        <header className={styles.sheetHeader}>
          <h2 id="global-menu-title">Menu</h2>
          <button
            className={styles.iconBtn}
            onClick={closeMenu}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <nav className={styles.sheetNav}>
          {baseLinks.map(({ href, label, icon }) => {
            const active =
              pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={closeMenu}
                className={`${styles.sheetLink} ${
                  active ? styles.active : ''
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span aria-hidden>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}

          {authAction.type === 'link' ? (
            <Link
              href={authAction.href}
              prefetch={false}
              onClick={closeMenu}
              className={styles.sheetLink}
            >
              <span aria-hidden>{authAction.icon}</span>
              <span>{authAction.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={authAction.onClick}
              className={styles.sheetLink}
            >
              <span aria-hidden>{authAction.icon}</span>
              <span>{authAction.label}</span>
            </button>
          )}
        </nav>
      </aside>
    </>,
    document.body
  );
}
