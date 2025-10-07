'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import { BsPerson, BsPersonVcard, BsEnvelope, BsBook, BsHourglassSplit, BsBoxArrowRight } from 'react-icons/bs';

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
  }, [router]);  

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Falha ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (!user) {
    return null; // ou uma tela de loading
  }

 return (
    <>
      <section className="title-section">
        <h1 className="title-section-heading">Meus Dados</h1>
      </section>

      <div className={styles.contentWrapper}>
        <div className={styles.dashboardContainer}>

          {/* 👇 A estrutura de dados completa e corrigida 👇 */}
          <div className={styles.userDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><BsPerson /> Meu Nome</span>
              <span className={styles.detailValue}>{user.nome}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><BsPersonVcard /> Meu RA</span>
              <span className={styles.detailValue}>{user.ra}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><BsEnvelope /> Email</span>
              <span className={styles.detailValue}>{user.email}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><BsBook /> Livro Atual</span>
              <span className={styles.detailValue}>Devolver em: --/--/----</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><BsHourglassSplit /> Status</span>
              <span className={styles.detailValue}>Em análise</span>
            </div>
          </div>

          <div className={styles.logoutButtonWrapper}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <BsBoxArrowRight />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}