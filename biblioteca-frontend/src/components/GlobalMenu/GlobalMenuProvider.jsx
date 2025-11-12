'use client';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
// Importação direta de next/navigation agora é recomendada para usePathname/useRouter em client components
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
  const [isAuthed, setIsAuthed] = useState(false);
  // CORREÇÃO DE HIDRATAÇÃO: Controla se o componente já foi montado no lado do cliente.
  const [isMounted, setIsMounted] = useState(false); 

  const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';

  // 1. CORREÇÃO DE HIDRATAÇÃO: Definir como true apenas após a montagem do lado do cliente.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Centraliza a atualização do estado de autenticação
  const setAuthState = useCallback((v) => {
    setIsAuthed(v);
    try {
      if (v) localStorage.setItem('isAuthed', '1');
      else localStorage.removeItem('isAuthed');
      window.dispatchEvent(new Event('auth:changed'));
    } catch (_) {}
  }, []);

  // Snapshot rápido a partir do localStorage (evita "piscar" Entrar)
  useEffect(() => {
    // Só executa se estiver montado no cliente
    if (!isMounted) return; 
    try {
      const snap = localStorage.getItem('isAuthed') === '1';
      if (snap) setIsAuthed(true);
    } catch (_) {}
  }, [isMounted]); // Adiciona isMounted como dependência

  // Checagem real no backend (cookie httpOnly)
  useEffect(() => {
    // Só executa se estiver montado no cliente
    if (!isMounted) return; 
    let aborted = false;
    (async () => {
      try {
        const r = await fetch(`${API}/auth/current-user`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!aborted) setAuthState(r.ok);
      } catch {
        if (!aborted) setAuthState(false);
      }
    })();
    return () => { aborted = true; };
  }, [API, setAuthState, isMounted]); // Adiciona isMounted como dependência

  // Mantém sincronizado com outras abas
  useEffect(() => {
    // Só executa se estiver montado no cliente
    if (!isMounted) return; 
    const sync = () => {
      try { setIsAuthed(localStorage.getItem('isAuthed') === '1'); } catch (_) {}
    };
    window.addEventListener('auth:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [isMounted]); // Adiciona isMounted como dependência

  // Controles do sheet
  const openMenu   = useCallback(() => setOpen(true), []);
  const closeMenu  = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen(v => !v), []);

  // Bloqueia scroll e ESC quando aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    // Verifica a existência de document antes de manipulá-lo
    if (typeof document !== 'undefined') {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.documentElement.style.overflow = prev;
      };
    }
  }, [open, closeMenu]);

  // Logout unificado
  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (_) {}
    try {
      ['authToken','token','accessToken','refreshToken','user','currentUser']
        .forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    setAuthState(false);
  }, [API, setAuthState]);

  return (
    <Ctx.Provider value={{ open, openMenu, closeMenu, toggleMenu, isAuthed, logout }}>
      {children}
      {/* 2. CORREÇÃO DE HIDRATAÇÃO: Renderiza o Sheet APENAS após a montagem no cliente. */}
      {isMounted && <GlobalMenuSheet />}
    </Ctx.Provider>
  );
}

/* ============================
    Menu Lateral (Sheet)
    - Função interna, encapsulada no Provider
============================ */
function GlobalMenuSheet() {
  const { open, closeMenu, isAuthed, logout } = useGlobalMenu();
  
  // NOTE: usePathname e useRouter já verificam typeof window. 
  // Não é necessário o `if (typeof document === 'undefined') return null;`
  // no topo da função se a renderização for condicional no Provider.
  const pathname = usePathname(); 
  const router = useRouter();

  // refs para acessibilidade (focus trap + retorno)
  const sheetRef = useRef(null);
  const lastFocusRef = useRef(null);

  // Gerencia foco ao abrir/fechar (focus trap simples + retorno ao trigger)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!open) {
      // restaura foco no trigger
      const el = lastFocusRef.current;
      if (el && typeof el.focus === 'function') {
        setTimeout(() => el.focus(), 0);
      }
      return;
    }

    // Se estiver aberto:
    const getFocusable = (root) =>
      root?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );

    // salva o elemento previamente focado
    lastFocusRef.current = document.activeElement;
    // foca o primeiro foco do sheet
    const focusables = getFocusable(sheetRef.current);
    if (focusables && focusables.length) {
      // dá um pequeno delay pra garantir montagem
      setTimeout(() => focusables[0]?.focus(), 0);
    }

    // prende TAB dentro do diálogo
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusable(sheetRef.current);
      if (!nodes || !nodes.length) return;
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    sheetRef.current?.addEventListener('keydown', onKeyDown);
    return () => sheetRef.current?.removeEventListener('keydown', onKeyDown);
  }, [open]);


  const baseLinks = [
    { href: '/siteFatec',  label: 'Home',    icon: '🏠' },
    { href: '/consulta',   label: 'Consulta', icon: '🔎' },
    { href: '/acervo',     label: 'Acervo',   icon: '📚' },
    { href: '/eventos',    label: 'Eventos',  icon: '📅' },
    { href: '/uploadForm', label: 'Uploads',  icon: '📤' },
    { href: '/servicos',   label: 'Serviços', icon: '🧰' },
    { href: '/dashboard',  label: 'Perfil',   icon: '💼' },
  ];

  const authAction = isAuthed
    ? { type: 'button', onClick: async () => { await logout(); closeMenu(); router.push('/login'); }, label: 'Sair',  icon: '🚪' }
    : { type: 'link',   href: '/login',                                                                     label: 'Entrar', icon: '👤' };

  // O check de typeof document === 'undefined' está no Provider, mas o createPortal 
  // ainda exige um check aqui se o componente fosse chamado em outro lugar. 
  // No entanto, como o Provider garante que só será montado no cliente, este bloco será executado.
  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-open={open}
        onClick={closeMenu}
        aria-hidden
      />
      <aside
        ref={sheetRef}
        id="global-menu"             // <- importante para aria-controls no Header
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
            // Nota: O uso de `pathname?.startsWith(href)` para ativo pode causar 
            // problemas em rotas como `/eventos` vs `/eventos/item`. 
            // Mantenha assim se for o comportamento desejado.
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