'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './MyEditModal.module.css'; 
import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

const API_URL = 'http://localhost:4000';

export function MyEditModal({ 
  item, 
  onClose, 
  onSaved = null, 
  onUpdateOnly = null, 
  mode = 'gerenciar', 
  onSaveAndApprove = null, 
  onReprove = null, 
  onDeleteApproved = null 
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

  useEffect(() => {
    if (item) {
      // 1. Unifica o título (pega de onde tiver valor)
      const tituloUnificado = item.titulo || item.titulo_proposto || '';
      
      // 2. Normaliza o tipo
      const tipoOriginal = item.tipo ? item.tipo.toLowerCase() : 'tcc';
      const tipoCerto = FIELDS_BY_TYPE[tipoOriginal] ? tipoOriginal : 'tcc';

      // 3. Reseta o form com os dados do item clicado
      setFormData(prev => ({
        ...prev,
        ...item,
        tipo: tipoCerto,
        
        // O PULO DO GATO: Preenche as duas variações de nome com o mesmo valor
        titulo: tituloUnificado,          
        titulo_proposto: tituloUnificado, 
        
        // Garante que os outros campos não venham undefined
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
      }));
    }
  }, [item]);

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

  // --- FUNÇÃO DE SALVAR (APENAS SALVAR) ---
  const handleSaveClick = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = `${API_URL}/api/admin/submissoes/${item.submissao_id}`;
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(formData),
      });

      const textResponse = await res.text();
      let jsonResponse;
      try { jsonResponse = JSON.parse(textResponse); } catch (err) { throw new Error(`Resposta inválida.`); }

      if (!res.ok) throw new Error(jsonResponse.message || 'Falha ao atualizar.');

      window.alert('Publicação atualizada com sucesso!');
      
      const updatedItem = { ...item, ...formData };
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

  // --- FUNÇÃO DE APROVAR (SALVA E APROVA) ---
  const handleApproveClick = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = `${API_URL}/api/admin/submissoes/${item.submissao_id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const textResponse = await res.text();
        let jsonResponse;
        try { jsonResponse = JSON.parse(textResponse); } catch(e) {}
        throw new Error(jsonResponse?.message || 'Falha ao salvar antes de aprovar.');
      }

      if (onSaveAndApprove) {
        await onSaveAndApprove(item.submissao_id, { ...item, ...formData });
      }
      onClose();

    } catch (err) {
      console.error("❌ Erro ao aprovar:", err);
      window.alert(`ERRO: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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
    // MUDANÇA: 'backdrop' virou 'overlay'
    <div className={styles.overlay} onClick={onClose}>
      
      {/* MUDANÇA: 'modal' virou 'modalBox' */}
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        
        <header className={styles.header}>
          <h2>
            {isPendentes ? 'Analisar Submissão' : `Editar Publicação`}
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
        </header>

        {/* O Form agora é o 'body' para permitir scroll apenas nele */}
        <form className={styles.body}>
          {fields.map((f) => (
            // MUDANÇA: 'group' virou 'formGroup'
            <div className={styles.formGroup} key={`${formData.tipo}-${f.name}`}>
              <label htmlFor={f.name}>
                {f.label} {f.required && <span style={{color:'red'}}>*</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  rows={4}
                  disabled={isSaving}
                  placeholder={`Digite ${f.label.toLowerCase()}...`}
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
                  placeholder={`Digite ${f.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
        </form>

        <footer className={styles.footer}>
          {/* MUDANÇA: Classes atualizadas para btnGhost */}
          <button
            type="button"
            className={styles.btnGhost}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>

          {isPendentes ? (
            <>
              {/* MUDANÇA: Classes atualizadas para btnReprovarModal e btnAprovarModal */}
              <button
                type="button"
                className={styles.btnReprovarModal}
                onClick={handleReproveClick}
              >
                Reprovar
              </button>
              <button
                type="button"
                className={styles.btnAprovarModal}
                onClick={handleApproveClick}
              >
                {isSaving ? 'Processando...' : 'Aprovar'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnAprovarModal}
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>

              {onDeleteApproved && (
                  <button
                    type="button"
                    className={styles.btnReprovarModal}
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