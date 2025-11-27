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
  persistente?: boolean;
  [key: string]: any;
};

const Ctx = createContext(null);
export const useGlobalMenu = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalMenu must be used inside <GlobalMenuProvider>');
  return ctx;
};

  const PUBLIC_ROUTES = ['/siteFatec', '/login', '/cadastro', '/', '/redefinir-senha', '/nova-senha', 'nova-conta', 'confirmar-conta', 'ativar-conta'];

export default function GlobalMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const AUTH_CHECK_URL = `${API_URL}/api/auth/current-user`;
  const LOGOUT_URL = `${API_URL}/api/auth/logout`;

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setIsMounted(true); }, []);

  const setUserData = useCallback((newUserData: User | null) => {
    setUser(newUserData);
    try {
      if (typeof window !== 'undefined') {
        if (newUserData && newUserData.role) {
          localStorage.setItem('userRole', newUserData.role);
        } else {
          localStorage.removeItem('userRole');
        }
      }
    } catch {}
  }, []);

  // --- FUNÇÃO DE LOGOUT SEGURA ---
  // forceReload: Se true, redireciona para Login com parâmetro especial
  const performLogout = useCallback(async (forceReload = false) => {
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Erro logout backend:', e);
    }
    
    setUserData(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_tab_valid');
      localStorage.removeItem('userRole');
    }

    if (forceReload && typeof window !== 'undefined') {
        // 🔴 CORREÇÃO AQUI: Envia parâmetro pro Middleware liberar a entrada
        window.location.href = '/login?forceLogout=true'; 
    }
  }, [LOGOUT_URL, setUserData]);



  // --- VERIFICAÇÃO DE AUTH ---
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setIsLoadingAuth(true);

      try {
        const res = await fetch(AUTH_CHECK_URL, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
           if (!cancelled) {
             setUserData(null);
             setIsLoadingAuth(false);
           }
           return;
        }

        const userDataFromApi = await res.json();
        
        // 🔒 LÓGICA DE ABA FECHADA
        if (userDataFromApi.persistente === false) {
          const isTabValid = sessionStorage.getItem('auth_tab_valid');
          
          if (!isTabValid) {
            console.warn('🔒 SESSÃO EXPIRADA: Aba fechada.');
            
            // VERIFICAÇÃO: Estou numa página pública?
            const isPublicPage = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

            if (isPublicPage) {
                // Se for pública: Logout silencioso (sem redirecionar)
                // O usuário apenas "desloga" visualmente, mas continua na Home.
                console.log('Matinha na rota pública. Fazendo logout silencioso.');
                await performLogout(false); // false = NÃO redireciona
            } else {
                // Se for privada (Dashboard): Logout forçado (chuta pro login)
                console.log('Rota protegida. Forçando saída.');
                await performLogout(true);  // true = redireciona
            }
            
            return; 
          }
        }

        const userData = { ...userDataFromApi, role: userDataFromApi.perfil };
        if (!cancelled) {
            setUserData(userData);
            setIsLoadingAuth(false);
        }

      } catch (err) {
        if (!cancelled) {
             setUserData(null);
             setIsLoadingAuth(false);
        }
      }
    };

    checkAuth();

    return () => { cancelled = true; };
  }, [AUTH_CHECK_URL, performLogout, setUserData, pathname]);

  // ... (funções de menu open/close/toggle)
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

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

  // Logout manual
  const logout = useCallback(async () => {
    await performLogout(false);
    router.push('/login');
  }, [performLogout, router]);

  const providerValue = useMemo(
    () => ({
      open, openMenu, closeMenu, toggleMenu, user, isAuthed: !!user, logout, setUserData, isLoading: isLoadingAuth
    }),
    [open, openMenu, closeMenu, toggleMenu, user, logout, setUserData, isLoadingAuth]
  );

  // Spinner Visual
  if (isMounted && isLoadingAuth) {
     const isProtectedRoute = pathname?.includes('/dashboard') || pathname?.includes('/admin') || pathname?.includes('/bibliotecario');
     if (isProtectedRoute) {
         return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
                <h3 style={{ color: '#555', fontFamily: 'sans-serif' }}>Carregando sistema...</h3>
            </div>
         );
     }
  }

  return (
    <Ctx.Provider value={providerValue}>
      {children}
      <GlobalMenuSheet />
    </Ctx.Provider>
  );
}

// GlobalMenuSheet (pode manter o mesmo)
function GlobalMenuSheet() {
    const { open, closeMenu, isAuthed, logout, user } = useGlobalMenu();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
  
    const profileLink = useMemo(() => {
      if (!isAuthed || !user?.role) return null;
      let href = '/dashboard';
      if (user.role === 'admin') href = '/admin/dashboard';
      else if (user.role === 'bibliotecario') href = '/bibliotecario/dashboard';
      return { href, label: 'Perfil', icon: '💼' };
    }, [isAuthed, user]);
  
    useEffect(() => setIsMounted(true), []);
    if (!isMounted) return null;
  
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
        <div className={styles.backdrop} data-open={open} onClick={closeMenu} aria-hidden />
        <aside className={styles.sheet} data-open={open} role="dialog" aria-modal="true">
          <header className={styles.sheetHeader}>
            <h2 className="sr-only">Menu</h2>
            <button className={styles.iconBtn} onClick={closeMenu}>✕</button>
          </header>
          <nav className={styles.sheetNav}>
            {baseLinks.map(({ href, label, icon }) => {
               const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
               return (
                 <Link key={href} href={href} onClick={closeMenu} className={`${styles.sheetLink} ${active ? styles.active : ''}`}>
                   <span aria-hidden>{icon}</span><span>{label}</span>
                 </Link>
               );
            })}
            {profileLink && (
              <Link href={profileLink.href} onClick={closeMenu} className={`${styles.sheetLink} ${pathname?.startsWith(profileLink.href) ? styles.active : ''}`}>
                <span aria-hidden>{profileLink.icon}</span><span>{profileLink.label}</span>
              </Link>
            )}
            {authAction.type === 'link' ? (
              <Link href={authAction.href} onClick={closeMenu} className={styles.sheetLink}>
                <span aria-hidden>{authAction.icon}</span><span>{authAction.label}</span>
              </Link>
            ) : (
              <button type="button" onClick={authAction.onClick as () => void} className={styles.sheetLink}>
                <span aria-hidden>{authAction.icon}</span><span>{authAction.label}</span>
              </button>
            )}
          </nav>
        </aside>
      </>,
      document.body
    );
}