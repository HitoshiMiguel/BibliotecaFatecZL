'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './globalMenu.module.css';

type User = {
  role: string;
  // Adicione outros campos se precisar, ex: nome: string;
};

/* ============================
  Contexto + Hook
============================ */
const Ctx = createContext(null);
export const useGlobalMenu = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useGlobalMenu must be used inside <GlobalMenuProvider>');
  }
  return ctx;
};

/* ============================
  Provider
============================ */
export default function GlobalMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const LOGOUT_URL = `${API_URL}/api/auth/logout`;

  // snapshot rápido para evitar "piscar"
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          // Define um usuário "parcial" só para o menu saber o link
          setUser({ role: storedRole });
        }
      }
    } catch {}
  }, []);

  const setUserData = useCallback((newUserData: User | null) => {
    setUser(newUserData);
    try {
      if (typeof window !== 'undefined') {
        if (newUserData && newUserData.role) {
          // Armazena o 'role' para o snapshot
          localStorage.setItem('userRole', newUserData.role);
          localStorage.removeItem('isAuthed'); // Limpa o antigo
        } else {
          // Limpa o 'role' ao deslogar
          localStorage.removeItem('userRole');
          localStorage.removeItem('isAuthed');
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch(AUTH_CHECK_URL, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) setUserData(null); // Deslogado
          return;
        }
        const userDataFromApi = await res.json();
        const userData = { userDataFromApi, role: userDataFromApi.perfil}

        if (!cancelled) setUserData(userData); // Logado com sucesso
      } catch (err) {
        if (!cancelled) setUserData(null); // Erro, deslogado
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [AUTH_CHECK_URL, setUserData]);

  // controls do sheet
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  // bloqueia scroll/ESC quando aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
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
      if (typeof window !== 'undefined') {
        ['authToken', 'token', 'accessToken', 'refreshToken', 'user', 'currentUser'].forEach(
          (k) => localStorage.removeItem(k)
        );
      }
    } catch {}
    setUserData(null);
  }, [LOGOUT_URL, setUserData]);

  const providerValue = useMemo(
    () => ({
      open,
      openMenu,
      closeMenu,
      toggleMenu,
      user,
      isAuthed: !!user,
      logout,
      setUserData,
    }),
    [open, openMenu, closeMenu, toggleMenu, user, logout, setUserData]
  );

  return (
    <Ctx.Provider
      value={providerValue} // <-- ✅ CORREÇÃO 1: Passando o valor correto
    >
      {children}
      <GlobalMenuSheet />
    </Ctx.Provider>
  );
}

/* ============================
  Menu Lateral (Sheet)
============================ */
function GlobalMenuSheet() {
  // ✅ CORREÇÃO 2: Todos os hooks são chamados no topo, incondicionalmente
  const { open, closeMenu, isAuthed, logout, user } = useGlobalMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // O useMemo é um hook, então deve vir ANTES de retornos condicionais
  const profileLink = useMemo(() => {
    // Se não estiver logado ou o 'user' ainda não tiver carregado o 'role'
    if (!isAuthed || !user?.role) {
      return null;
    }

    let href = '/dashboard'; // Rota padrão para usuários normais

    // Define a rota baseada no 'role'
    if (user.role === 'admin') {
      href = '/admin/dashboard';
    } else if (user.role === 'bibliotecario') {
      href = '/bibliotecario/dashboard';
    }
    // Adicione outros 'else if' se tiver mais roles

    return { href, label: 'Perfil', icon: '💼' };
  }, [isAuthed, user]);

  // Efeitos vêm depois dos hooks de estado/memo
  useEffect(() => setIsMounted(true), []);

  // Retorno condicional vem DEPOIS de todos os hooks
  if (!isMounted) return null;

  // O resto da lógica de renderização
  const baseLinks = [
    { href: '/siteFatec', label: 'Home', icon: '🏠' },
    { href: '/consulta', label: 'Consulta', icon: '🔎' },
    { href: '/uploadForm', label: 'Uploads', icon: '📤' },
  ];

  const authAction = isAuthed
    ? {
        type: 'button',
        onClick: async () => {
          await logout();
          closeMenu();
          router.push('/login');
        },
        label: 'Sair',
        icon: '🚪',
      }
    : {
        type: 'link',
        href: '/login',
        label: 'Entrar',
        icon: '👤',
      };

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
          <h2 id="global-menu-title" className="sr-only">Menu</h2> {/* Usei sr-only para acessibilidade */}
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
              pathname === href ||
              (href !== '/' && pathname?.startsWith(href));
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

          {/* Link de Perfil Dinâmico */}
          {profileLink && (
            <Link
              key={profileLink.href}
              href={profileLink.href}
              prefetch={false}
              onClick={closeMenu}
              className={`${styles.sheetLink} ${
                (pathname === profileLink.href || (profileLink.href !== '/' && pathname?.startsWith(profileLink.href)))
                  ? styles.active
                  : ''
              }`}
              aria-current={(pathname === profileLink.href || (profileLink.href !== '/' && pathname?.startsWith(profileLink.href))) ? 'page' : undefined}
            >
              <span aria-hidden>{profileLink.icon}</span>
              <span>{profileLink.label}</span>
            </Link>
          )}

          {/* Botão de Entrar/Sair */}
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
              onClick={authAction.onClick as () => void} // Cast para evitar erros TS
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