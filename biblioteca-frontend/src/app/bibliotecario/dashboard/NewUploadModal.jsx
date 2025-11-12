'use client';
import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import styles from './MyEditModal.module.css'; // Reutilizando o CSS do outro modal
import { TIPOS, FIELDS_BY_TYPE } from './formConstants.js'; // Importando constantes

const API_URL = 'http://localhost:4000';

export function NewUploadModal({ onClose, onUploadComplete }) {
  const [tipo, setTipo] = useState('tcc');
  const [formData, setFormData] = useState({}); // Para campos de texto (metadados)
  const [file, setFile] = useState(null); // Para o arquivo
  const [isUploading, setIsUploading] = useState(false);

  // Define quais campos de metadados mostrar
  const fields = useMemo(() => FIELDS_BY_TYPE[tipo], [tipo]);

  // Atualiza o estado dos campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Atualiza o estado do arquivo
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  // Função principal de upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire('Erro', 'Por favor, selecione um arquivo para enviar.', 'error');
      return;
    }
    
    setIsUploading(true);

    // Precisamos usar 'FormData' para enviar arquivos e texto juntos
    const uploadData = new FormData();
    uploadData.append('arquivo', file); // 'arquivo' é o nome que o backend espera
    uploadData.append('tipo', tipo);

    // Adiciona todos os metadados ao FormData
    for (const key of Object.keys(formData)) {
      if (formData[key]) {
        uploadData.append(key, formData[key]);
      }
    }
    
    // NOTA: Este é um NOVO endpoint que você precisa criar!
    const UPLOAD_URL = `${API_URL}/api/admin/publicar-direto`;

    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        credentials: 'include',
        body: uploadData, 
        // Não defina 'Content-Type', o FormData faz isso automaticamente
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Falha no upload');

      Swal.fire('Sucesso!', 'Arquivo publicado diretamente.', 'success');
      onUploadComplete(result); // Informa a página principal sobre o sucesso
      onClose(); // Fecha o modal

    } catch (err) {
      Swal.fire('Erro no Upload', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    // Usamos o 'style' inline que consertamos
    <div 
      style={{
        position: 'absolute', top: `${window.scrollY}px`, left: 0,
        width: '100%', height: '100vh', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1000,
        padding: '1rem', boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Usamos <form> aqui */}
        <form onSubmit={handleSubmit}>

          <div className={styles.header}>
            <h2>Publicar Novo Documento</h2>
            <div className={styles.tipoToggle}>
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button" // Importante: 'type="button"' para não submeter o form
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
            {/* --- O Input do Arquivo --- */}
            <div className={styles.formGroup}>
              <label htmlFor="arquivo">Arquivo (PDF, DOCX, etc.) *</label>
              <input
                type="file"
                id="arquivo"
                name="arquivo"
                onChange={handleFileChange}
                required
                disabled={isUploading}
                style={{ border: '1px solid #ccc', padding: '8px' }}
              />
            </div>
            
            {/* --- Inputs de Metadados --- */}
            {fields.map((f) => (
              <div className={styles.formGroup} key={`${tipo}-${f.name}`}>
                <label htmlFor={f.name}>{f.label}{f.required && ' *'}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={f.name} name={f.name} onChange={handleChange}
                    rows={4} disabled={isUploading}
                  />
                ) : (
                  <input
                    id={f.name} name={f.name} type={f.type}
                    onChange={handleChange} required={f.required}
                    disabled={isUploading}
                  />
                )}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.btnGhost} disabled={isUploading}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnAprovarModal} disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Publicar Agora'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}