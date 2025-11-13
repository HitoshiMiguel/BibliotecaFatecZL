// src/app/consulta/[id]/page.jsx
'use client';

import React, { useEffect, useState, use } from 'react';
import Swal from 'sweetalert2';
import styles from './publicacao.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PublicacaoPage({ params }) {
  // Next 15: params é uma Promise em client components
  const { id } = use(params);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setErro('');
      try {
        const res = await fetch(`${API_BASE}/publicacoes/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          if (res.status === 404) {
            setErro('Publicação não encontrada.');
            setData(null);
            return;
          }
          throw new Error(`Falha ao buscar publicação (status ${res.status})`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setErro('Erro ao carregar dados da publicação.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleOpenFile = () => {
    if (!data?.caminho_anexo) {
      Swal.fire({
        icon: 'error',
        title: 'Arquivo indisponível',
        text: 'Esta publicação não possui arquivo anexado.',
        confirmButtonColor: '#b20000',
      });
      return;
    }

    const raw = String(data.caminho_anexo).trim();

    // Se já for uma URL completa, usa direto
    const isFullUrl = /^https?:\/\//i.test(raw);
    const url = isFullUrl
      ? raw
      : `https://drive.google.com/file/d/${raw}/view?usp=sharing`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <main className={styles.wrap}>
        <h1 className={styles.title}>Carregando publicação...</h1>
      </main>
    );
  }

  if (erro || !data) {
    return (
      <main className={styles.wrap}>
        <h1 className={styles.title}>Publicação</h1>
        <p style={{ color: '#b20000', marginTop: '16px' }}>
          {erro || 'Publicação não encontrada.'}
        </p>
      </main>
    );
  }

  const disponivel = !!data.caminho_anexo;
  const isPDF =
    disponivel && /\.pdf($|\?)/i.test(String(data.caminho_anexo || ''));

  return (
    <main className={styles.wrap}>
      <div className={styles.banner}>Publicação</div>

      <section className={styles.content}>
        <aside className={styles.thumb}>
          {/* Futuro: render capa. Por enquanto placeholder */}
          <div className={styles.coverStub}>CAPA</div>
        </aside>

        <article className={styles.info}>
          <h1 className={styles.h1}>{data.titulo_proposto}</h1>

          <ul className={styles.descList}>
            {data.descricao && (
              <li>
                <strong>Descrição:</strong> {data.descricao}
              </li>
            )}
            {data.autor && (
              <li>
                <strong>Autor:</strong> {data.autor}
              </li>
            )}
            {data.editora && (
              <li>
                <strong>Editora:</strong> {data.editora}
              </li>
            )}
            {(data.ano_publicacao || data.ano_defesa) && (
              <li>
                <strong>Ano de publicação:</strong>{' '}
                {data.ano_publicacao || data.ano_defesa}
              </li>
            )}
            {data.conferencia && (
              <li>
                <strong>Conferência:</strong> {data.conferencia}
              </li>
            )}
            {data.periodico && (
              <li>
                <strong>Periódico:</strong> {data.periodico}
              </li>
            )}
            {data.instituicao && (
              <li>
                <strong>Instituição:</strong> {data.instituicao}
              </li>
            )}
            {data.orientador && (
              <li>
                <strong>Orientador:</strong> {data.orientador}
              </li>
            )}
            {data.curso && (
              <li>
                <strong>Curso:</strong> {data.curso}
              </li>
            )}
            {data.tipo && (
              <li>
                <strong>Tipo:</strong> {data.tipo}
              </li>
            )}
            <li>
              <strong>Disponibilidade:</strong>{' '}
              {disponivel
                ? isPDF
                  ? 'Disponível em PDF'
                  : 'Disponível'
                : 'Indisponível'}
            </li>
          </ul>

          {disponivel && (
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleOpenFile}
            >
              Visualizar / Download
            </button>
          )}
        </article>
      </section>
    </main>
  );
}
