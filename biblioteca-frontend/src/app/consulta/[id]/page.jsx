// src/app/consulta/[id]/page.jsx
import styles from './publicacao.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function getData(id) {
  const res = await fetch(`${API}/publicacoes/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicacaoPage({ params }) {
  const data = await getData(params.id);
  if (!data) {
    return (
      <main className={styles.wrap}>
        <h1 className={styles.title}>Publicação não encontrada</h1>
      </main>
    );
  }

  const disponivel = !!data.caminho_anexo;
  const isPDF = disponivel && /\.pdf($|\?)/i.test(data.caminho_anexo || '');

  return (
    <main className={styles.wrap}>
      <div className={styles.banner}>Publicação</div>

      <section className={styles.content}>
        <aside className={styles.thumb}>
          {/* Se tiver uma capa no futuro, renderiza aqui. Por ora, placeholder simples */}
          <div className={styles.coverStub}>CAPA</div>
        </aside>

        <article className={styles.info}>
          <h1 className={styles.h1}>{data.titulo_proposto}</h1>

          <ul className={styles.descList}>
            {data.descricao && <li><strong>Descrição:</strong> {data.descricao}</li>}
            {data.autor && <li><strong>Autor:</strong> {data.autor}</li>}
            {data.editora && <li><strong>Editora:</strong> {data.editora}</li>}
            {(data.ano_publicacao || data.ano_defesa) && (
              <li><strong>Ano de publicação:</strong> {data.ano_publicacao || data.ano_defesa}</li>
            )}
            {data.conferencia && <li><strong>Conferência:</strong> {data.conferencia}</li>}
            {data.periodico && <li><strong>Periódico:</strong> {data.periodico}</li>}
            {data.instituicao && <li><strong>Instituição:</strong> {data.instituicao}</li>}
            {data.orientador && <li><strong>Orientador:</strong> {data.orientador}</li>}
            {data.curso && <li><strong>Curso:</strong> {data.curso}</li>}
            {data.tipo && <li><strong>Tipo:</strong> {data.tipo}</li>}
            <li><strong>Disponibilidade:</strong> {disponivel ? (isPDF ? 'Disponível em PDF' : 'Disponível') : 'Indisponível'}</li>
          </ul>

          {disponivel && (
            <a className={styles.downloadBtn} href={data.caminho_anexo} target="_blank" rel="noreferrer">
              Download
            </a>
          )}
        </article>
      </section>
    </main>
  );
}
