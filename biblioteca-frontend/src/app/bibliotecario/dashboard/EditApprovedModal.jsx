'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './MyEditModal.module.css';
import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

// URL hardcoded para garantir que não há erro de variável de ambiente
const API_URL = 'http://localhost:4000';

export function EditApprovedModal({ item, onClose, onSaved }) {
  
  // Normalização inicial dos dados
  const tipoOriginal = item.tipo ? item.tipo.toLowerCase() : 'tcc';
  const tipoInicial = FIELDS_BY_TYPE[tipoOriginal] ? tipoOriginal : 'tcc';
  const tituloUnificado = item.titulo || item.titulo_proposto || '';

  const [formData, setFormData] = useState({
    ...item,
    tipo: tipoInicial,
    titulo: tituloUnificado,
    titulo_proposto: tituloUnificado,
    autor: item.autor || '',
    editora: item.editora || '',
    ano_publicacao: item.ano_publicacao || item.ano || '',
    descricao: item.descricao || '',
  });

  useEffect(() => {
    if (item) {
      // 1. Descobre qual título usar (do banco novo ou antigo)
      const tituloCerto = item.titulo || item.titulo_proposto || '';
      
      // 2. Normaliza o tipo
      const tipoOriginal = item.tipo ? item.tipo.toLowerCase() : 'tcc';
      const tipoCerto = FIELDS_BY_TYPE[tipoOriginal] ? tipoOriginal : 'tcc';

      // 3. Força o formulário a atualizar com os dados do item clicado
      setFormData(prev => ({
        ...prev,        // Mantém estrutura
        ...item,        // Pega todos os dados do item
        tipo: tipoCerto,
        
        // Garante que o input 'titulo' receba valor
        titulo: tituloCerto,           
        titulo_proposto: tituloCerto,  
        
        // Garante os outros campos
        autor: item.autor || '',
        editora: item.editora || '',
        ano_publicacao: item.ano_publicacao || item.ano || '',
        descricao: item.descricao || '',
      }));
    }
  }, [item]); // <--- Isso obriga o React a rodar sempre que o 'item' mudar

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

  // --- FUNÇÃO DE SALVAR SIMPLIFICADA ---
  const handleSaveClick = async () => {
    // Removi o 'e.preventDefault()' para evitar erros se o evento não vier
    console.log("Botão Salvar Clicado!"); 
    
    setIsSaving(true);

    try {
      // Monta a URL
      const endpoint = `${API_URL}/api/admin/submissoes/${item.submissao_id}`;
      
      console.log("🚀 Tentando enviar para:", endpoint);
      console.log("📦 Dados:", formData);

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // O body vai aqui
      });

      const textResponse = await res.text(); 
      console.log("📩 Resposta bruta do servidor:", textResponse);

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Erro ao ler JSON. Resposta foi: ${textResponse.substring(0, 50)}...`);
      }

      if (!res.ok) {
        throw new Error(jsonResponse.message || 'Falha ao atualizar.');
      }

      // SUCESSO
      window.alert('Publicação atualizada com sucesso!');
      onSaved({ ...item, ...formData });
      onClose();

    } catch (err) {
      console.error("❌ Erro no Frontend:", err);
      window.alert(`ERRO: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Trava o scroll enquanto o modal está aberto
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Editar Publicação (ID: {item.submissao_id})</h2>

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
                {f.label} {f.required && ' *'}
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
            type="button" // Importante: garante que não submeta form
            onClick={onClose} 
            className={styles.btnGhost} 
            disabled={isSaving}
          >
            Cancelar
          </button>
          
          <button 
            type="button" // Importante: garante que não submeta form
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