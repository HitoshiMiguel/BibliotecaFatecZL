'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Falha na autenticação:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [router]);

  // ✅ A LÓGICA CORRETA PARA O LOGOUT ESTÁ AQUI DENTRO DO JSX
  const handleLogout = async () => {
    try {
      // 1. Avisa o backend para apagar o cookie
      await fetch('http://localhost:4000/api/logout', {
        method: 'POST',
        credentials: 'include', // Essencial para o backend saber qual cookie apagar
      });
      
      // 2. Apenas depois, redireciona o usuário
      window.location.href = '/login';
    } catch (error) {
      console.error('Falha ao fazer logout:', error);
      alert('Erro ao tentar sair.');
    }
  };

  if (isLoading) {
    return <p style={{ padding: '40px', fontFamily: 'sans-serif' }}>Carregando...</p>;
  }
  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard do Usuário (ID: {user.id})</h1>
      <p>Bem-vindo! Seu acesso foi validado.</p>
      
      <button 
        onClick={handleLogout} // Chama a função que definimos acima
        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Sair
      </button>
    </div>
  );
}