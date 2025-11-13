'use client';
import { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import styles from './MyEditModal.module.css'; // reaproveitando o mesmo CSS
import { TIPOS, FIELDS_BY_TYPE } from './formConstants.js';

const API_URL = 'http://localhost:4000';

export function NewUploadModal({ onClose, onUploadComplete }) {
  const [tipo, setTipo] = useState('tcc');
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fields = useMemo(() => FIELDS_BY_TYPE[tipo], [tipo]);

  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire('Erro', 'Por favor, selecione um arquivo para enviar.', 'error');
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
    
    const UPLOAD_URL = `${API_URL}/api/admin/publicar-direto`;

    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha no upload');

      Swal.fire('Sucesso!', 'Arquivo publicado diretamente.', 'success');
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
              {TIPOS.map(t => (
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
            <div className={styles.formGroup}>
              <label htmlFor="arquivo">Arquivo (PDF, DOCX, etc.) *</label>
              <input
                type="file"
                id="arquivo"
                name="arquivo"
                onChange={handleFileChange}
                required
                disabled={isUploading}
                style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: 4 }}
              />
            </div>

            {fields.map((f) => (
              <div className={styles.formGroup} key={`${tipo}-${f.name}`}>
                <label htmlFor={f.name}>{f.label}{f.required && ' *'}</label>
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
              className={styles.btnAprovarModal}
              disabled={isUploading}
            >
              {isUploading ? 'Enviando...' : 'Publicar Agora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
