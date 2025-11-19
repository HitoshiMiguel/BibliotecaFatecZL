'use client';

import React, { useEffect, useState, use } from 'react';
// Removido sweetalert2 para evitar erro de build
import styles from './publicacao.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
      // Alerta nativo para não precisar instalar libs extras
      window.alert('Arquivo indisponível: Esta publicação não possui arquivo anexado.');
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

  // --- NOVA LÓGICA DE DISPONIBILIDADE ---
  const temArquivo = !!data.caminho_anexo;
  
  // Prioriza o status que vem do banco (para livros físicos), depois tenta inferir pelo arquivo
  let textoDisponibilidade = 'Indisponível';

  if (data.disponibilidade) {
      // Caso 1: Backend mandou explicitamente (ex: "Disponível", "Emprestado")
      textoDisponibilidade = data.disponibilidade;
  } else if (data.status_fisico) {
      // Caso 2: Veio com o nome antigo de variável
      textoDisponibilidade = data.status_fisico;
  } else if (temArquivo) {
      // Caso 3: É digital e tem arquivo
      const isPDF = /\.pdf($|\?)/i.test(String(data.caminho_anexo));
      textoDisponibilidade = isPDF ? 'Disponível em PDF' : 'Disponível para Download';
  }

  // Define a cor do badge baseado no texto
  const isPositivo = textoDisponibilidade.toLowerCase().includes('disponível');
  const corStatus = isPositivo ? 'green' : '#b20000'; // Verde ou Vermelho Fatec

  return (
    <main className={styles.wrap}>
      <div className={styles.banner}>Publicação</div>

      <section className={styles.content}>
        <aside className={styles.thumb}>
          {/* Se for físico, mostra texto LIVRO, senão CAPA */}
          <div className={styles.coverStub}>
             {data.tipo === 'fisico' ? 'LIVRO' : 'CAPA'}
          </div>
        </aside>

        <article className={styles.info}>
          <h1 className={styles.h1}>{data.titulo_proposto}</h1>

          <ul className={styles.descList}>
            {data.descricao && (
              <li style={{ marginBottom: '20px', fontStyle: 'italic' }}>
                {data.descricao}
              </li>
            )}
            {data.localizacao && (
              <li>
                <strong>Localização na Estante:</strong> {data.localizacao}
              </li>
            )}
            
            {data.isbn && (
              <li>
                <strong>ISBN:</strong> {data.isbn}
              </li>
            )}

            {data.detalhes_fisicos && (
              <li>
                <strong>Detalhes:</strong> {data.detalhes_fisicos}
              </li>
            )}

            {data.codigo_barras && (
              <li>
                <strong>Código de Barras:</strong> {data.codigo_barras}
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
                <strong>Tipo:</strong> {data.tipo === 'fisico' ? 'Livro Físico' : data.tipo}
              </li>
            )}
            <li>
              <strong>Disponibilidade:</strong>{' '}
              <span style={{ color: corStatus, fontWeight: 'bold' }}>
                {textoDisponibilidade}
              </span>
            </li>
          </ul>

          {/* Botão de Download (Só aparece se tiver arquivo) */}
          {temArquivo && (
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleOpenFile}
            >
              Visualizar / Download
            </button>
          )}
          
          {/* Botão de Reserva (Só aparece se for físico e disponível) */}
          {!temArquivo && data.tipo === 'fisico' && isPositivo && (
             <button
                type="button"
                className={styles.downloadBtn} 
                style={{ backgroundColor: '#28a745', marginTop: '10px' }} 
                onClick={() => window.alert('Funcionalidade de reserva em breve!')}
             >
                Reservar Livro
             </button>
          )}

        </article>
      </section>
    </main>
  );
}