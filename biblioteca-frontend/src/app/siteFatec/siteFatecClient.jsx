// Arquivo: src/app/siteFatec/page.jsx
'use client'; 

import MainNavbar from "@/components/MainNavbar";
import styles from './siteFatec.module.css';
import { Container, Breadcrumb } from 'react-bootstrap';
import React, { useEffect } from 'react';

export default function SiteFatecPage() {

  // --- Definir o título da página dinamicamente ---
    useEffect(() => {
        // Altere o título conforme necessário para esta página
        document.title = 'Site Fatec Online - Biblioteca Fatec ZL'; 
    }, []);

  return (
    
    <>
      <MainNavbar className={styles.fatecNav} />
      <div className={styles.breadcrumbWrap}>
        <Container>
          <Breadcrumb listProps={{ className: 'mb-0' }}>
            <Breadcrumb.Item href="/">
              <i className="bi bi-house-door-fill"></i> Home
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
                Informações da Biblioteca Online
            </Breadcrumb.Item>
          </Breadcrumb>
        </Container>
      </div>

      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Biblioteca Online</h1>

        <p className={styles.introText}>
            A biblioteca da Fatec Zona Leste foi modernizada para oferecer mais praticidade, acessibilidade e eficiência no acesso às informações acadêmicas. Aqui, alunos e docentes encontram um espaço digital intuitivo, com recursos para consulta ao acervo, reserva de livros, acesso a obras digitais e materiais de estudo. Nosso objetivo é tornar o conhecimento ainda mais acessível, unindo tecnologia e educação em um ambiente confiável e fácil de usar.
        </p>

        <div className={styles.buttonContainer}>
          <a href="/consulta" className={styles.actionButton}>Consulte o acervo online</a>
          <a href="/solicitacao" className={styles.actionButton}>Solicitação para a biblioteca</a>
        </div>

        </main>
        
    </>

    
  );

  
}
