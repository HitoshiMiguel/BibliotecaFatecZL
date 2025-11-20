'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './MyEditModal.module.css'; 
import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

const API_URL = 'http://localhost:4000';

// 🔴 CORREÇÃO: Adicionamos '= null' para tornar as props opcionais e sumir com o erro TS(2741)
export function MyEditModal({ 
  item, 
  onClose, 
  onSaved = null,           // Tornado opcional
  onUpdateOnly = null,      // Tornado opcional
  mode = 'gerenciar', 
  onSaveAndApprove = null,  // Tornado opcional
  onReprove = null,         // Tornado opcional
  onDeleteApproved = null   // Tornado opcional
}) {
  const isPendentes = mode === 'pendente';

  const tipoOriginal = item.tipo ? item.tipo.toLowerCase() : 'tcc';
  const tipoInicial = FIELDS_BY_TYPE[tipoOriginal] ? tipoOriginal : 'tcc';

  const [formData, setFormData] = useState({
    ...item,
    tipo: tipoInicial,
    titulo_proposto: item.titulo_proposto || item.titulo || '',
    autor: item.autor || '',
    editora: item.editora || '',
    ano_publicacao: item.ano_publicacao || item.ano || '',
    descricao: item.descricao || '',
    conferencia: item.conferencia || '',
    periodico: item.periodico || '',
    instituicao: item.instituicao || '',
    orientador: item.orientador || '',
    curso: item.curso || '',
    ano_defesa: item.ano_defesa || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const fields = useMemo(
    () => FIELDS_BY_TYPE[formData.tipo] || [],
    [formData.tipo]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (novoTipo) => {
    setFormData(prev => ({ ...prev, tipo: novoTipo }));
  };

  // --- FUNÇÃO DE SALVAR (UPDATE REAL) ---
  const handleSaveClick = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = `${API_URL}/api/admin/submissoes/${item.submissao_id}`;
      console.log("🚀 Enviando PUT para:", endpoint);

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(formData),
      });

      const textResponse = await res.text();
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(textResponse);
      } catch (err) {
        throw new Error(`Resposta inválida do servidor.`);
      }

      if (!res.ok) {
        throw new Error(jsonResponse.message || 'Falha ao atualizar.');
      }

      window.alert('Publicação atualizada com sucesso!');
      
      const updatedItem = { ...item, ...formData };

      // Chama a função que estiver disponível (suporta tanto a versão nova quanto a antiga)
      if (onUpdateOnly) onUpdateOnly(updatedItem);
      if (onSaved) onSaved(updatedItem);
      
      onClose();

    } catch (err) {
      console.error("❌ Erro:", err);
      window.alert(`ERRO: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveClick = (e) => {
    e.preventDefault();
    if (onSaveAndApprove) onSaveAndApprove(item.submissao_id);
  };

  const handleReproveClick = (e) => {
    e.preventDefault();
    if (onReprove) onReprove(item.submissao_id);
  };
  
  const handleDeleteClick = (e) => {
      e.preventDefault();
      if(onDeleteApproved) onDeleteApproved(item.submissao_id);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className={styles.backdrop || styles.overlay} onClick={onClose}>
      <div className={styles.modal || styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>
            {isPendentes ? 'Analisar Submissão' : `Editar Publicação (ID: ${item.submissao_id})`}
          </h2>
          
          {!isPendentes && (
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
          )}

          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </header>

        <form className={styles.body}>
          {fields.map((f) => (
            <div className={styles.group || styles.formGroup} key={`${formData.tipo}-${f.name}`}>
              <label className={styles.label}>
                {f.label} {f.required && ' *'}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  className={styles.input}
                  id={f.name}
                  name={f.name}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  rows={4}
                  disabled={isSaving}
                />
              ) : (
                <input
                  className={styles.input}
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
        </form>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnCancelar || styles.btnGhost}
            onClick={onClose}
            disabled={isSaving}
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
                type="button"
                className={styles.btnAprovar}
                onClick={handleApproveClick}
              >
                Aprovar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnAprovar || styles.btnAprovarModal}
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>

              {onDeleteApproved && (
                 <button
                    type="button"
                    className={styles.btnReprovar}
                    style={{ marginLeft: '10px', backgroundColor: '#d9534f' }}
                    onClick={handleDeleteClick}
                 >
                    Excluir
                 </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  );
}