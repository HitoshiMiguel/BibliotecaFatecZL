// src/app/bibliotecario/dashboard/MyEditModal.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
//import styles from './MyEditModal.module.css'; // ou o CSS que você já usa
import styles from './edit-modal.module.css';

export function EditModal({
  mode = 'pendente',          // 'pendente' | 'gerenciar'
  item,
  onClose,
  onSaveAndApprove,           // (id) => Promise
  onReprove,                  // (id) => Promise
  onUpdateOnly,               // (updatedItem) => void
  onDeleteApproved,           // (id) => void  👈 NOVO
}) {
  const isPendentes = mode === 'pendente';

  // Estado local do form (título, autor, etc.)
  const [formData, setFormData] = useState({
    titulo_proposto: '',
    descricao: '',
    autor: '',
    editora: '',
    ano_publicacao: '',
    conferencia: '',
    periodico: '',
    instituicao: '',
    orientador: '',
    curso: '',
    ano_defesa: '',
    tipo: '',
  });

  // Preenche o formulário com os dados do item assim que abrir
  useEffect(() => {
    if (!item) return;
    setFormData({
      titulo_proposto: item.titulo_proposto || '',
      descricao: item.descricao || '',
      autor: item.autor || '',
      editora: item.editora || '',
      ano_publicacao: item.ano_publicacao || '',
      conferencia: item.conferencia || '',
      periodico: item.periodico || '',
      instituicao: item.instituicao || '',
      orientador: item.orientador || '',
      curso: item.curso || '',
      ano_defesa: item.ano_defesa || '',
      tipo: item.tipo || '',
    });
  }, [item]);

  if (!item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitUpdateOnly = (e) => {
    e.preventDefault();
    if (!onUpdateOnly) return;

    // Monta objeto atualizado mantendo campos originais que não estão no form
    const updated = {
      ...item,
      ...formData,
    };

    onUpdateOnly(updated);
    onClose();
  };

  const handleApproveClick = (e) => {
    e.preventDefault();
    if (!onSaveAndApprove) return;
    onSaveAndApprove(item.submissao_id);
  };

  const handleReproveClick = (e) => {
    e.preventDefault();
    if (!onReprove) return;
    onReprove(item.submissao_id);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    if (!onDeleteApproved) return;
    onDeleteApproved(item.submissao_id);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>
            {isPendentes ? 'Analisar Submissão' : 'Editar Publicação Aprovada'}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </header>

        <form className={styles.form} onSubmit={isPendentes ? handleApproveClick : handleSubmitUpdateOnly}>
          <div className={styles.group}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              name="titulo_proposto"
              value={formData.titulo_proposto}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Descrição</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Autor</label>
            <input
              className={styles.input}
              name="autor"
              value={formData.autor}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Editora</label>
            <input
              className={styles.input}
              name="editora"
              value={formData.editora}
              onChange={handleChange}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.group}>
              <label className={styles.label}>Ano publicação</label>
              <input
                className={styles.input}
                name="ano_publicacao"
                value={formData.ano_publicacao}
                onChange={handleChange}
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Ano defesa</label>
              <input
                className={styles.input}
                name="ano_defesa"
                value={formData.ano_defesa}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Conferência</label>
            <input
              className={styles.input}
              name="conferencia"
              value={formData.conferencia}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Periódico</label>
            <input
              className={styles.input}
              name="periodico"
              value={formData.periodico}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Instituição</label>
            <input
              className={styles.input}
              name="instituicao"
              value={formData.instituicao}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Orientador</label>
            <input
              className={styles.input}
              name="orientador"
              value={formData.orientador}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Curso</label>
            <input
              className={styles.input}
              name="curso"
              value={formData.curso}
              onChange={handleChange}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Tipo</label>
            <input
              className={styles.input}
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
            />
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancelar}
              onClick={onClose}
            >
              Cancelar
            </button>

            {isPendentes ? (
              <>
                <button
                  type="button"
                  className={styles.btnReprovar}
                  onClick={handleReproveClick}
                >
                  Reprovar
                </button>
                <button
                  type="submit"
                  className={styles.btnAprovar}
                >
                  Aprovar
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  className={styles.btnAprovar}
                >
                  Salvar alterações
                </button>

                {onDeleteApproved && (
                  <button
                    type="button"
                    className={styles.btnReprovar} // reutiliza estilo vermelho
                    onClick={handleDeleteClick}
                  >
                    Excluir publicação
                  </button>
                )}
              </>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}
