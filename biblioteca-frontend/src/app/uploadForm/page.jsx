'use client';
// 1. Importar useEffect e useRouter
import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // <-- Importar o Router
import Swal from 'sweetalert2';
import styles from './uploadForm.module.css';
import { BsFileEarmarkPdf, BsUpload, BsXCircle } from 'react-icons/bs';

const TIPOS = [
  { value: 'tcc', label: 'TCC' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'livro', label: 'Livro' },
];

const FIELDS_BY_TYPE = {
  // ... (Sua lógica de campos, sem alteração) ...
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // 2. Adicionar Router e estado de Loading
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Começa true

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // 3. Adicionar o useEffect para verificar a autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/current-user`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          // Se não estiver OK (ex: 401), não está logado
          // Redireciona para o login
          router.push('/login?redirect=/uploadForm');
          return; // Para a execução aqui
        }

        // Se estiver OK, o usuário está logado.
        // A página pode carregar.
        setIsLoading(false);

      } catch (error) {
        // Se der erro de rede, algo falhou, redireciona para o login
        console.error('Falha ao verificar autenticação:', error);
        router.push('/login?redirect=/uploadForm');
      }
    };

    checkAuth();
  }, [router, apiUrl]); // Depende do router e apiUrl

  const initialValues = useMemo(() => {
    const entries = FIELDS_BY_TYPE[tipo].map(f => [f.name, '']);
    return Object.fromEntries(entries);
  }, [tipo]);

  const [form, setForm] = useState(initialValues);

  const handleTipoChange = (nextTipo) => {
    setTipo(nextTipo);
    const nextValues = Object.fromEntries(
      FIELDS_BY_TYPE[nextTipo].map(f => [f.name, ''])
    );
    setForm(nextValues);
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);

      const toastTitle = `Arquivo "${file.name}" carregado!`;

      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: toastTitle,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } else {
      setFileName('');
    }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    // ... (Sua função handleSubmit, sem alteração) ...
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(e.target);
    data.append('tipo', tipo);
    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Arquivo enviado com sucesso para o Drive!',
        });
        setForm(initialValues);
        setFileName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Falha no Upload',
          text: result.error || 'Não foi possível enviar o arquivo.',
        });
      }
    } catch (err) {
      console.error('Erro no envio:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro de Conexão',
        text: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = FIELDS_BY_TYPE[tipo];

  // 4. Adicionar a tela de Loading
  if (isLoading) {
    // Você pode criar um componente de Spinner/Loading global depois
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        Verificando sua sessão...
      </div>
    );
  }

  // 5. O return normal, que só é mostrado se (isLoading) for false
  return (
    <>
      {/* Barra de título (vermelha) - Vem do CSS Global */}
      <section className="title-section">
        <h1 className="title-section-heading">Upload de Materiais</h1>
      </section>

      {/* Card branco para o formulário */}
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          
          {/* Toggle do Tipo de Upload */}
          <div className={`${styles.group} ${styles.toggleGroup}`}>
            <label className={styles.label}>Tipo do Upload</label>
            <div className={styles.tipoToggle}>
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button" 
                  className={tipo === t.value ? styles.active : ''}
                  onClick={() => handleTipoChange(t.value)}
                  disabled={isSubmitting}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campos dinâmicos */}
          {fields.map((f) => (
            <div className={styles.group} key={f.name}>
              <label className={styles.label} htmlFor={f.name}>{f.label}{f.required && ' *'}</label>

              {f.type === 'textarea' ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  className={`${styles.input} ${styles.textarea}`}
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  rows={5}
                  disabled={isSubmitting}
                />
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  className={styles.input}
                  type={f.type}
                  inputMode={f.type === 'number' ? 'numeric' : undefined}
                  min={f.min}
                  max={f.max}
                  value={form[f.name] ?? ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  required={!!f.required}
                  disabled={isSubmitting}
                />
              )}
            </div>
          ))}

          {/* Input de Arquivo Estilizado */}
          <div className={styles.group}>
            <label className={styles.label} htmlFor="file">Arquivo (PDF)*</label>
            <label className={styles.fileInputLabel} htmlFor="file">
              
              {/* Parte Esquerda: Texto e Ícone */}
              <span className={styles.fileInputText}>
                <BsFileEarmarkPdf />
                {fileName || 'Clique para selecionar um arquivo...'}
              </span>

              {/* Parte Direita: Botão de Remover */}
              <div className={styles.fileInputActions}>
                {fileName && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className={styles.removeFileButton}
                    aria-label="Remover arquivo"
                  >
                    <BsXCircle />
                  </button>
                )}
              </div>

            </label>
            <input
              id="file"
              name="file"
              type="file"
              className={styles.fileInputHidden}
              ref={fileInputRef}
              accept=".pdf"
              required
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Ações */}
          <div className={styles.actions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSubmitting}>
              <BsUpload />
              {isSubmitting ? 'Enviando...' : 'Fazer Upload'}
            </button>
            <a href="/siteFatec" className={`${styles.btn} ${styles.btnGhost}`}>
              Voltar
            </a>
          </div>
        </form>
      </div>
    </>
  );
}