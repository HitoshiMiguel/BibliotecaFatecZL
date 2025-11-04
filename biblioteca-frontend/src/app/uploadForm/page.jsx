'use client';
import { useMemo, useState } from 'react';
import styles from './uploadForm.module.css';

const TIPOS = [
  { value: 'tcc', label: 'TCC' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'livro', label: 'Livro' },
];

// Esquemas de campos por tipo de upload
const FIELDS_BY_TYPE = {
  tcc: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'instituicao', label: 'Instituição', type: 'text', required: true },
    { name: 'orientador', label: 'Orientador', type: 'text' },
    { name: 'curso', label: 'Curso', type: 'text' },
    { name: 'anoDefesa', label: 'Ano de Defesa', type: 'number', min: 1900, max: 2100 },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  artigo: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'instituicao', label: 'Instituição', type: 'text' },
    { name: 'conferencia', label: 'Conferência', type: 'text' },
    { name: 'periodico', label: 'Periódico', type: 'text' },
    { name: 'anoPublicacao', label: 'Ano de publicação', type: 'number', min: 1900, max: 2100 },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  livro: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'editora', label: 'Editora', type: 'text' },
    { name: 'anoPublicacao', label: 'Ano de publicação', type: 'number', min: 1400, max: 2100 },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
};

export default function UploadFormPage() {
  const [tipo, setTipo] = useState('tcc');

  // estado genérico para todos os campos
  const initialValues = useMemo(() => {
    const entries = FIELDS_BY_TYPE[tipo].map(f => [f.name, '']);
    return Object.fromEntries(entries);
  }, [tipo]);
  const [form, setForm] = useState(initialValues);

  // quando muda o tipo, reseta os campos do novo tipo
  const handleTipoChange = (e) => {
    const nextTipo = e.target.value;
    setTipo(nextTipo);
    const nextValues = Object.fromEntries(
      FIELDS_BY_TYPE[nextTipo].map(f => [f.name, ''])
    );
    setForm(nextValues);
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    data.append('tipo', tipo);

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (result.success) {
        alert('✅ Arquivo enviado com sucesso para o Drive!');
        console.log('📄 Detalhes do arquivo:', result.driveFile);
      } else {
        alert('❌ Falha no upload: ' + result.error);
      }
    } catch (err) {
      console.error('Erro no envio:', err);
      alert('Erro de conexão com o servidor.');
    }
  };

  const fields = FIELDS_BY_TYPE[tipo];

  return (
    <main className={styles.page}>
      {/* Barra de título (vermelha) */}
      <div className={styles.headerBar}>
        <h1 className={styles.headerTitle}>Upload</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Select do tipo */}
        <div className={styles.group}>
          <label className={styles.label} htmlFor="tipo">Tipo do Upload</label>
          <div className={styles.inputWrap}>
            <select
              id="tipo"
              className={styles.select}
              value={tipo}
              onChange={handleTipoChange}
              aria-label="Tipo do Upload"
            >
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className={styles.caret} aria-hidden>▾</span>
          </div>
        </div>

        {/* Campos dinâmicos */}
        {fields.map((f) => (
          <div className={styles.group} key={f.name}>
            <label className={styles.label} htmlFor={f.name}>{f.label}</label>

            {f.type === 'textarea' ? (
              <textarea
                id={f.name}
                className={`${styles.input} ${styles.textarea}`}
                value={form[f.name] ?? ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                rows={5}
              />
            ) : (
              <input
                id={f.name}
                className={styles.input}
                type={f.type}
                inputMode={f.type === 'number' ? 'numeric' : undefined}
                min={f.min}
                max={f.max}
                value={form[f.name] ?? ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                required={!!f.required}
              />
            )}
          </div>
        ))}

        {/* Campo de upload de arquivo */}
        <div className={styles.group}>
          <label className={styles.label} htmlFor="file">Arquivo</label>
          <input
            id="file"
            name="file"
            type="file"
            className={styles.input}
            accept=".pdf"
            required
          />
        </div>

        {/* Ações */}
        <div className={styles.actions}>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Upload
          </button>
          <a href="javascript:history.back()" className={`${styles.btn} ${styles.btnGhost}`}>
            Voltar
          </a>
        </div>
      </form>
    </main>
  );
}
