'use client';

import { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import styles from './MyEditModal.module.css';
import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

const API_URL = 'http://localhost:4000';

export function EditApprovedModal({ item, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    ...item,
    tipo: (item.tipo && FIELDS_BY_TYPE[item.tipo]) ? item.tipo : 'tcc',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fields = useMemo(
    () => FIELDS_BY_TYPE[formData.tipo],
    [formData.tipo]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (novoTipo) => {
    setFormData(prev => ({ ...prev, tipo: novoTipo }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/submissoes/${item.submissao_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || 'Falha ao atualizar publicação.');
      }

      Swal.fire('Atualizado!', 'Publicação atualizada com sucesso.', 'success');
      // atualiza a lista no pai com os dados editados
      onSaved({ ...item, ...formData });
      onClose();
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // trava scroll
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>Editar Publicação</h2>

          <div className={styles.tipoToggle}>
            {TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                className={formData.tipo === t.value ? styles.active : ''}
                onClick={() => handleTipoChange(t.value)}
                disabled={isSaving}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.body}>
          {fields.map((f) => (
            <div className={styles.formGroup} key={`${formData.tipo}-${f.name}`}>
              <label htmlFor={f.name}>
                {f.label}
                {f.required && ' *'}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  rows={4}
                  disabled={isSaving}
                />
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  required={f.required}
                  disabled={isSaving}
                />
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.btnGhost}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            className={styles.btnAprovarModal}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
