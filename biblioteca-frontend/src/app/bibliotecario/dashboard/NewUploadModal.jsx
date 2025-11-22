'use client';
import { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import styles from './MyEditModal.module.css';
import { TIPOS, FIELDS_BY_TYPE } from './formConstants.js';
import { FaPaperclip, FaTimes, FaCalendarAlt, FaClock } from 'react-icons/fa'; // NOVO: Ícones

const API_URL = 'http://localhost:4000';

export function NewUploadModal({ onClose, onUploadComplete }) {
  const [tipo, setTipo] = useState('tcc');
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fields = useMemo(() => FIELDS_BY_TYPE[tipo], [tipo]);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ALTERADO: Função de seleção de arquivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;

    if (selectedFile) {
      // Validação extra para garantir que é PDF
      if (selectedFile.type !== 'application/pdf') {
        Swal.fire({
          icon: 'error',
          title: 'Arquivo Inválido',
          text: 'Por favor, selecione apenas arquivos no formato PDF.',
          confirmButtonColor: '#b20000',
        });
        e.target.value = null; // Limpa o seletor
        setFile(null);
        return;
      }
      
      setFile(selectedFile);

      // NOVO: Alerta "toast" de sucesso ao anexar
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Arquivo "${selectedFile.name}" anexado!`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      setFile(null);
    }
  };

  // NOVO: Função para remover o arquivo selecionado
  const handleRemoveFile = () => {
    setFile(null);
    // Limpa o valor do input escondido
    const fileInput = document.getElementById('arquivo');
    if (fileInput instanceof HTMLInputElement) {
      fileInput.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire({
        icon: 'error',
        title: 'Arquivo Faltando',
        text: 'Por favor, selecione um arquivo para enviar.',
        confirmButtonColor: '#b20000',
      });
      return;
    }

    if (isScheduled && !scheduleDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Obrigatória',
        text: 'Para agendar, você deve selecionar uma data e hora.',
        confirmButtonColor: '#b20000',
      });
      return;
    }

    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append('arquivo', file);
    uploadData.append('tipo', tipo);

    for (const key of Object.keys(formData)) {
      if (formData[key]) {
        uploadData.append(key, formData[key]);
      }
    }

    if (isScheduled) {
      uploadData.append('status', 'agendado');
      
      // ⚠️ CORREÇÃO: Envie a string direta do input (ex: "2025-11-22T14:43")
      // NÃO use new Date() aqui.
      uploadData.append('data_publicacao', scheduleDate); 
    } else {
      uploadData.append('status', 'publicado');
      // Se for publicado agora, o backend pode usar NOW(), 
      // ou você pode enviar a data atual aqui: new Date().toISOString()
    }

    const UPLOAD_URL = `${API_URL}/api/admin/publicar-direto`;

    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha no upload');

      // Este é o alerta de SUCESSO NO UPLOAD (diferente do de anexar)
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Arquivo publicado diretamente.',
        confirmButtonColor: '#b20000',
      });
      onUploadComplete(result);
      onClose();
    } catch (err) {
      Swal.fire('Erro no Upload', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className={styles.header}>
            <h2>Publicar Novo Documento</h2>
            <div className={styles.tipoToggle}>
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={t.value === tipo ? styles.active : ''}
                  onClick={() => setTipo(t.value)}
                  disabled={isUploading}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.body}>
            {/* ======================================================= */}
            {/* ÁREA DO INPUT DE ARQUIVO TOTALMENTE MODIFICADA         */}
            {/* ======================================================= */}
            <div className={styles.formGroup}>
              <label htmlFor="arquivo">Arquivo (PDF) *</label>

              {/* Input de arquivo real, agora escondido */}
              <input
                type="file"
                id="arquivo"
                name="arquivo"
                onChange={handleFileChange}
                required
                disabled={isUploading}
                className={styles.hiddenFileInput} // <--- Classe para esconder
                accept="application/pdf" // <--- Boa prática
              />

              {!file ? (
                // 1. Botão customizado (antes de selecionar)
                <label htmlFor="arquivo" className={styles.fileInputLabel}>
                  <FaPaperclip color="#555" />
                  Clique para selecionar um arquivo...
                </label>
              ) : (
                // 2. Box de arquivo selecionado (depois de selecionar)
                <div className={styles.fileSelectedBox}>
                  {/* Trunca nomes de arquivo muito longos */}
                  <span title={file.name}>{file.name}</span> 
                  <button
                    type="button"
                    className={styles.fileRemoveBtn}
                    onClick={handleRemoveFile}
                    aria-label="Remover arquivo"
                    disabled={isUploading}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
            {/* ======================================================= */}
            {/* FIM DA ÁREA MODIFICADA                                 */}
            {/* ======================================================= */}

            {fields.map((f) => (
              <div className={styles.formGroup} key={`${tipo}-${f.name}`}>
                <label htmlFor={f.name}>
                  {f.label}
                  {f.required && ' *'}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={f.name}
                    name={f.name}
                    onChange={handleChange}
                    rows={4}
                    disabled={isUploading}
                  />
                ) : (
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    onChange={handleChange}
                    required={f.required}
                    disabled={isUploading}
                  />
                )}
              </div>
            ))}

          {/* ======================================================= */}
            {/* NOVA ÁREA: AGENDAMENTO DA PUBLICAÇÃO                   */}
            {/* ======================================================= */}
            <div className={styles.formGroup} style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Opções de Publicação
              </label>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="agendamento"
                    checked={!isScheduled}
                    onChange={() => setIsScheduled(false)}
                    disabled={isUploading}
                  />
                  <FaClock /> Publicar Agora
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="agendamento"
                    checked={isScheduled}
                    onChange={() => setIsScheduled(true)}
                    disabled={isUploading}
                  />
                  <FaCalendarAlt /> Agendar
                </label>
              </div>

              {isScheduled && (
                <div className={styles.fadeIn}> {/* Assumindo que você possa ter uma classe de animação, senão pode remover */}
                  <label htmlFor="scheduleDate" style={{ fontSize: '0.9rem', color: '#666' }}>
                    Escolha a data e hora da publicação:
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduleDate"
                    className={styles.inputDate} // Caso não tenha estilo específico, ele usará o padrão do navegador
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    disabled={isUploading}
                    required={isScheduled}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      marginTop: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              )}
            </div>
            {/* ======================================================= */}
            {/* FIM DA NOVA ÁREA                                       */}
            {/* ======================================================= */}

          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnGhost}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnAprovarModal} // Você pode querer renomear esta classe
              disabled={isUploading || !file} // Desabilita se não tiver arquivo
            >
              {isUploading ? 'Enviando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}