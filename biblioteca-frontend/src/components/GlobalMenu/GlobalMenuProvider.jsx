'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './globalMenu.module.css';

/* ============================
   Contexto + Hook
============================ */
const Ctx = createContext(null);
export const useGlobalMenu = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalMenu must be used inside <GlobalMenuProvider>');
  return ctx;
};

/* ============================
   Provider
============================ */
export default function GlobalMenuProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const LOGOUT_URL = `${API_URL}/api/auth/logout`;

  // snapshot rápido para evitar "piscar"
  useEffect(() => {
    try {
      if (localStorage.getItem('isAuthed') === '1') setIsAuthed(true);
    } catch {}
  }, []);

  const setAuthState = useCallback((v) => {
    setIsAuthed(v);
    try {
      if (v) localStorage.setItem('isAuthed', '1');
      else localStorage.removeItem('isAuthed');
      window.dispatchEvent(new Event('auth:changed'));
    } catch {}
  }, []);

  // checagem real no backend (cookie httpOnly)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(AUTH_CHECK_URL, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (alive) setAuthState(res.ok);
      } catch {
        if (alive) setAuthState(false);
      }
    })();

    const sync = async () => {
      try {
        const res = await fetch(AUTH_CHECK_URL, { credentials: 'include', cache: 'no-store' });
        setAuthState(res.ok);
      } catch {
        setAuthState(false);
      }
    };
    window.addEventListener('auth:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      alive = false;
      window.removeEventListener('auth:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [AUTH_CHECK_URL, setAuthState]);

  // controls do sheet
  const openMenu  = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen(v => !v), []);

  // bloqueia scroll/ESC quando aberto
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

  // logout unificado
  const logout = useCallback(async () => {
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch {}
    try {
      ['authToken','token','accessToken','refreshToken','user','currentUser']
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    setAuthState(false);
  }, [LOGOUT_URL, setAuthState]);

  return (
    <Ctx.Provider value={{ open, openMenu, closeMenu, toggleMenu, isAuthed, logout }}>
      {children}
      <GlobalMenuSheet />
    </Ctx.Provider>
  );
}

/* ============================
   Menu Lateral (Sheet)
============================ */
function GlobalMenuSheet() {
  const { open, closeMenu, isAuthed, logout } = useGlobalMenu();
  const pathname = usePathname();
  const router = useRouter();

  // Fix de hidratação: só renderiza portal depois de montar no cliente
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  const baseLinks = [
    { href: '/siteFatec', label: 'Home',     icon: '🏠' },
    { href: '/consulta',  label: 'Consulta', icon: '🔎' },
    { href: '/acervo',    label: 'Acervo',   icon: '📚' },
    { href: '/eventos',   label: 'Eventos',  icon: '📅' },
    { href: '/uploadForm',label: 'Uploads',  icon: '📤' },
    { href: '/servicos',  label: 'Serviços', icon: '🧰' },
    { href: '/dashboard', label: 'Perfil',   icon: '💼' },
  ];

  const authAction = isAuthed
    ? { type: 'button', onClick: async () => { await logout(); closeMenu(); router.push('/login'); }, label: 'Sair', icon: '🚪' }
    : { type: 'link',   href: '/login', label: 'Entrar', icon: '👤' };

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
          <button className={styles.iconBtn} onClick={closeMenu} aria-label="Fechar">✕</button>
        </header>

        <nav className={styles.sheetNav}>
          {baseLinks.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={closeMenu}
                className={`${styles.sheetLink} ${active ? styles.active : ''}`}
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
            <button type="button" onClick={authAction.onClick} className={styles.sheetLink}>
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
