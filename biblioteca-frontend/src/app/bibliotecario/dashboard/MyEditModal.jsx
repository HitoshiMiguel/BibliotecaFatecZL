'use client';

import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

import styles from './MyEditModal.module.css';
import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

const API_URL = 'http://localhost:4000';

export function EditModal({
  mode = 'pendente',          // 'pendente' | 'gerenciar'
  item,
  onClose,
  onSaveAndApprove,
  onReprove,
  onUpdateOnly,
}) {
  const [formData, setFormData] = useState({
    ...item,
    tipo:
      item.tipo && FIELDS_BY_TYPE[item.tipo]
        ? item.tipo
        : 'tcc',
  });
  const [isSaving, setIsSaving] = useState(false);

  const isGerenciar = mode === 'gerenciar';

  const fields = useMemo(() => {
    return FIELDS_BY_TYPE[formData.tipo] || [];
  }, [formData.tipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (novoTipo) => {
    setFormData((prev) => ({ ...prev, tipo: novoTipo }));
  };

  // trava o scroll do body enquanto o modal está aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // SALVAR (pendente = salvar + aprovar / gerenciar = salvar apenas)
  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      // 1) sempre atualiza a submissão
      const resUpdate = await fetch(
        `${API_URL}/api/admin/submissoes/${item.submissao_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );

      if (!resUpdate.ok) {
        const err = await resUpdate.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao atualizar os dados.');
      }

      // 2) comportamento por modo
      if (isGerenciar) {
        // apenas atualiza lista no front
        const atualizado = { ...item, ...formData };
        if (onUpdateOnly) onUpdateOnly(atualizado);
        Swal.fire('Salvo!', 'Publicação atualizada com sucesso.', 'success');
        onClose();
      } else {
        // modo pendente: depois de salvar, aprova
        await onSaveAndApprove(item.submissao_id);
        onClose();
      }
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReproveClick = async () => {
    await onReprove(item.submissao_id);
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <h2>
            {isGerenciar ? 'Editar Publicação Aprovada' : 'Analisar Submissão'}
          </h2>

          <div className={styles.tipoToggle}>
            {TIPOS.map((t) => (
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

        {/* BODY */}
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

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.btnGhost}
            disabled={isSaving}
          >
            Cancelar
          </button>

          {!isGerenciar && (
            <button
              onClick={handleReproveClick}
              className={styles.btnReprovarModal}
              disabled={isSaving}
            >
              Reprovar
            </button>
          )}

          <button
            onClick={handleSaveClick}
            className={styles.btnAprovarModal}
            disabled={isSaving}
          >
            {isSaving
              ? isGerenciar
                ? 'Salvando...'
                : 'Aprovando e salvando...'
              : isGerenciar
              ? 'Salvar alterações'
              : 'Aprovar'}
          </button>
        </div>
      </div>
    </div>
  );
}
