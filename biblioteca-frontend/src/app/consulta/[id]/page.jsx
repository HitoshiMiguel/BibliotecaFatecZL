'use client';

import React, { useEffect, useState, use } from 'react';
import Swal from 'sweetalert2';
import styles from './publicacao.module.css';
import RatingStars from '@/components/RatingStars';


import CapaLivro from '@/components/CapaLivro';


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PublicacaoPage({ params }) {
  const { id } = use(params);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // --- ESTADOS PARA RESERVA ---
  const [reservaModalAberto, setReservaModalAberto] = useState(false);
  const [dataRetirada, setDataRetirada] = useState('');
  const [criandoReserva, setCriandoReserva] = useState(false);
  const [erroReserva, setErroReserva] = useState('');
  const [etapaReserva, setEtapaReserva] = useState('data');

  function formatarDataBR(isoDateStr) {
    if (!isoDateStr) return '';
    const [ano, mes, dia] = isoDateStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setErro('');
      try {
        const res = await fetch(`${API_BASE}/api/publicacoes/${id}`, {
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

  if (loading) {
    return (
      <main className={styles.wrap}>
        {/* 1. CORREÇÃO: Colocando o banner como primeiro elemento do wrap */}
        <div className={styles.banner}>Carregando...</div>
        <h1 className={styles.title} style={{ padding: 20 }}>Aguarde um momento...</h1>
      </main>
    );
  }

  if (erro || !data) {
    return (
      <main className={styles.wrap}>
        {/* 1. CORREÇÃO: Colocando o banner como primeiro elemento do wrap */}
        <div className={styles.banner}>Erro</div>
        <div style={{ padding: 20 }}>
          <h1 className={styles.title}>Publicação</h1>
          <p style={{ color: '#b20000', marginTop: '16px' }}>{erro || 'Publicação não encontrada.'}</p>
        </div>
      </main>
    );
  }

  // --- LÓGICA DE DISPONIBILIDADE ---
  const temArquivo = !!data.caminho_anexo;
  // Se tem arquivo, mostramos a Capa (que tentará baixar o PDF)
  const mostrarCapa = temArquivo;

  let textoDisponibilidade = 'Indisponível';

  if (data.disponibilidade) {
    textoDisponibilidade = data.disponibilidade;
  } else if (data.status_fisico) {
    textoDisponibilidade = data.status_fisico;
  } else if (temArquivo) {
    textoDisponibilidade = 'Disponível para Download';
  }

  const disponibilidadeLower = textoDisponibilidade.toLowerCase();
  const isPositivo = disponibilidadeLower.startsWith('disponível');
  const corStatus = isPositivo ? 'var(--color-success, #28a745)' : 'var(--color-danger, #b20000)';

  // --- DATA PREVISTA DE DEVOLUÇÃO ---
  let dataDevolucaoFormatada = null;
  if (dataRetirada) {
    const [anoStr, mesStr, diaStr] = dataRetirada.split('-');
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    const dia = Number(diaStr);

    if (!Number.isNaN(ano) && !Number.isNaN(mes) && !Number.isNaN(dia)) {
      const inicio = new Date(ano, mes - 1, dia);
      const devolucao = new Date(inicio);
      devolucao.setDate(devolucao.getDate() + 7);
      dataDevolucaoFormatada = devolucao.toLocaleDateString('pt-BR');
    }
  }

  const LINK_DOWNLOAD = `${API_BASE}/api/publicacoes/acessar/${id}`;

  return (
    <main className={styles.wrap}>
      {/* 1. CORREÇÃO: GARANTE QUE O BANNER ESTEJA COLADO AO TOPO DO WRAP */}
      <div className={styles.banner}>Publicação</div>

      {/* 2. CORREÇÃO: O content é o GRID principal que coloca THUMB e INFO lado a lado */}
      <section className={styles.content}>
        
        {/* COLUNA 1: CAPA/THUMB */}
        <aside className={styles.thumb}>
          {mostrarCapa ? (
            // Capa PDF Dinâmica
            <div className={styles.coverBox}>
              {/* O CapaLivro deve se encaixar no styles.coverBox que tem width: 200px e height: auto */}
              <CapaLivro publicacaoId={id} />
            </div>
          ) : (
            // 3. CORREÇÃO: Usando a classe .coverStub para o placeholder de livro físico ter a altura correta (200x300)
            <div className={styles.coverStub}>
              {data.tipo === 'fisico' ? 'LIVRO' : 'CAPA'}
            </div>
          )}
        </aside>

        {/* COLUNA 2: INFORMAÇÕES/INFO */}
        <article className={styles.info}>
          <h1 className={styles.h1}>{data.titulo_proposto}</h1>
            {data.descricao && (
              <p className={styles.description}>
                {data.descricao}
              </p>
            )}

            {/* METADADOS ESSENCIAIS E COMPACTOS */}
            <ul className={styles.metadataList}>
              {data.autor && <li><span className={styles.icon}>✍️</span> <strong>Autor:</strong> {data.autor}</li>}
              {data.editora && <li><span className={styles.icon}>🏢</span> <strong>Editora:</strong> {data.editora}</li>}
              {(data.ano_publicacao || data.ano_defesa) && <li><span className={styles.icon}>📅</span> <strong>Ano:</strong> {data.ano_publicacao || data.ano_defesa}</li>}
              {data.tipo && <li><span className={styles.icon}>📚</span> <strong>Tipo:</strong> {data.tipo === 'fisico' ? 'Livro Físico' : data.tipo}</li>}
            </ul>

          {/* DISPONIBILIDADE E BOTÕES DE AÇÃO */}
          <div className={styles.actionsBox}>
            <div className={styles.statusPill} style={{ backgroundColor: isPositivo ? 'rgba(40, 167, 69, 0.1)' : 'rgba(178, 0, 0, 0.1)', color: corStatus }}>
              <strong>Status:</strong> {textoDisponibilidade}
            </div>

            {temArquivo && (
              <a
                href={LINK_DOWNLOAD}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.actionButton} ${styles.downloadBtn}`}
              >
                📥 Visualizar / Download
              </a>
            )}

            {!temArquivo && data.tipo === 'fisico' && isPositivo && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.reserveBtn}`}
                onClick={() => {
                  setErroReserva('');
                  setDataRetirada('');
                  setEtapaReserva('data');
                  setReservaModalAberto(true);
                }}
              >
                📅 Reservar Livro
              </button>
            )}
          </div>
          
          {/* SEÇÃO DE AVALIAÇÕES */}
          <div className={styles.ratingSection}>
            <RatingStars
              itemId={data.item_id || id}
              publicacaoId={id}
              tipo={data.tipo === 'fisico' ? 'fisico' : 'digital'}
              onRatingChange={() => {}}
            />
          </div>
        </article>
      </section>

      {/* MODAL DE RESERVA (sem alterações de estilo) */}
      {reservaModalAberto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>
              {etapaReserva === 'data' ? 'Escolher data de retirada' : 'Confirmar reserva'}
            </h2>
            <p style={{ marginTop: 0, fontSize: '0.95rem', color: '#555' }}>
              {etapaReserva === 'data' ? 'Selecione a data em que pretende buscar o livro na biblioteca.' : 'Confira as informações antes de confirmar a reserva.'}
            </p>

            {etapaReserva === 'data' && (
              <>
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <label htmlFor="data-retirada" style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Data prevista para retirada:</label>
                  {(() => {
                    const hoje = new Date();
                    const max = new Date();
                    max.setDate(max.getDate() + 7);
                    const hojeISO = hoje.toISOString().split('T')[0];
                    const maxISO = max.toISOString().split('T')[0];
                    return (
                      <input id="data-retirada" type="date" value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} min={hojeISO} max={maxISO} style={{ padding: '6px 8px', width: '100%' }} />
                    );
                  })()}
                </div>
                {erroReserva && <p style={{ color: '#b20000', marginTop: 0, marginBottom: '12px' }}>{erroReserva}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setReservaModalAberto(false); setErroReserva(''); setDataRetirada(''); }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>Cancelar</button>
                  <button type="button" onClick={() => { if (!dataRetirada) { setErroReserva('Por favor, selecione a data de retirada.'); return; } setErroReserva(''); setEtapaReserva('confirmacao'); }} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#b20000', color: '#fff', fontWeight: 500 }}>Avançar</button>
                </div>
              </>
            )}

            {etapaReserva === 'confirmacao' && (
              <>
                <div style={{ marginTop: '16px', marginBottom: '16px', padding: '12px', borderRadius: '6px', backgroundColor: '#f9f9f9', fontSize: '0.95rem' }}>
                  <p style={{ margin: '4px 0' }}><strong>Livro:</strong> {data.titulo_proposto}</p>
                  {data.autor && <p style={{ margin: '4px 0' }}><strong>Autor:</strong> {data.autor}</p>}
                  <p style={{ margin: '4px 0' }}><strong>Data de retirada:</strong> {formatarDataBR(dataRetirada)}</p>
                  {dataDevolucaoFormatada && <p style={{ margin: '4px 0' }}><strong>Data prevista para devolução:</strong> {dataDevolucaoFormatada}</p>}
                </div>
                {erroReserva && <p style={{ color: '#b20000', marginTop: 0, marginBottom: '12px' }}>{erroReserva}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setEtapaReserva('data')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }} disabled={criandoReserva}>Voltar</button>
                  <button type="button" onClick={async () => {
                    if (!dataRetirada) { setErroReserva('Data de retirada não informada.'); setEtapaReserva('data'); return; }
                    setErroReserva(''); setCriandoReserva(true);
                    try {
                      const res = await fetch(`${API_BASE}/api/reservas`, {
                        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ submissaoId: id, dataRetirada: dataRetirada }),
                      });
                      const json = await res.json();
                      if (!res.ok) {
                        const msg = json?.message || json?.error || (res.status === 401 ? 'Você precisa estar logado para fazer uma reserva.' : 'Falha ao criar reserva.');
                        setErroReserva(msg); return;
                      }
                      setReservaModalAberto(false); setCriandoReserva(false);
                      Swal.fire({
                        title: 'Reserva Confirmada!',
                        html: `<div style="text-align: left; font-size: 0.95rem;"><p>Sua reserva foi realizada com sucesso.</p><hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;"><p><strong>📘 Livro:</strong> ${data.titulo_proposto}</p><p><strong>📅 Data de retirada:</strong> ${formatarDataBR(dataRetirada)}</p>${dataDevolucaoFormatada ? `<p><strong>🔄 Devolução prevista:</strong> ${dataDevolucaoFormatada}</p>` : ''}<br/><p style="color: #555; font-size: 0.85rem;">Apresente-se à biblioteca nesta data para concluir o empréstimo.</p></div>`,
                        icon: 'success', confirmButtonText: 'Entendi, obrigado!', confirmButtonColor: '#28a745', allowOutsideClick: false,
                      }).then((result) => { if (result.isConfirmed) { window.location.reload(); } });
                    } catch (err) { setErroReserva('Erro de conexão.'); console.error(err); } finally { setCriandoReserva(false); }
                  }} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontWeight: 500 }} disabled={criandoReserva}>
                    {criandoReserva ? 'Reservando...' : 'Confirmar reserva'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}