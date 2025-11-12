'use client';

// Importações do React e de libs
import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

// 1. IMPORTANDO O NOSSO *NOVO* ARQUIVO CSS
import styles from './MyEditModal.module.css';

import { FIELDS_BY_TYPE, TIPOS } from './formConstants.js';

// URL da sua API
const API_URL = 'http://localhost:4000';

// ====================================================================
// = Componente Modal de Edição (CORRIGIDO)
// ====================================================================
export function EditModal({ item, onClose, onSaveAndApprove, onReprove }) {

  // --- 1. ESTADOS ---
  const [formData, setFormData] = useState({
    ...item,
    tipo: (item.tipo && FIELDS_BY_TYPE[item.tipo]) ? item.tipo : 'tcc',
  }); 
  const [isSaving, setIsSaving] = useState(false);
  const [scrollTop, setScrollTop] = useState(0); // Para posicionar o modal

  // --- 2. LÓGICA ---
  const fields = useMemo(() => {
    return FIELDS_BY_TYPE[formData.tipo];
  }, [formData.tipo]);

  // Atualiza o estado do formulário quando o usuário digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Atualiza o 'tipo'
  const handleTipoChange = (novoTipo) => {
    setFormData(prev => ({ ...prev, tipo: novoTipo }));
  };

  // Função para "Salvar e Aprovar"
  const handleSaveApproveClick = async () => {
    setIsSaving(true);
    try {
      const resUpdate = await fetch(`${API_URL}/api/admin/submissoes/${item.submissao_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!resUpdate.ok) {
        const err = await resUpdate.json();
        throw new Error(err.message || 'Falha ao atualizar os dados.');
      }
      await onSaveAndApprove(item.submissao_id);
      onClose(); 
    } catch (err) {
      Swal.fire('Erro!', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para "Reprovar"
  const handleReproveClick = async () => {
    await onReprove(item.submissao_id); 
    onClose();
  };

  // --- 3. EFEITOS (useEffect) ---
  
  // Este useEffect roda UMA VEZ quando o modal é criado
  // para travar o scroll da página e posicionar o modal
  useEffect(() => {
    // Pega o scroll Y atual
    const scrollY = window.scrollY;
    setScrollTop(scrollY);

    // Salva o estilo SÓ DO <html>
    const prevHtmlOverflow = document.documentElement.style.overflow;
    
    // Trava o scroll SÓ NO <html>
    document.documentElement.style.overflow = 'hidden';

    // Roda QUANDO O MODAL DESAPARECE
    return () => {
      // Restaura o estilo SÓ DO <html>
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []); // O array vazio [] faz isso rodar só no "mount" e "unmount"


  // --- 4. RENDERIZAÇÃO (JSX) ---
  // (Só pode haver UM 'return' na função)
  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      style={{
        position: 'absolute',
        top: `${scrollTop}px`, // Posição que pegamos do scroll
        left: 0,
        width: '100%',
        height: '100vh', // Altura total da tela
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)', // O fundo escuro
        zIndex: 1000, // Garante que fica na frente
        padding: '1rem', // Espaçamento de segurança
        boxSizing: 'border-box',
      }}
    > 
      {/* e.stopPropagation() impede que o clique no modal feche o modal */}
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}> 
        
        {/* --- HEADER --- */}
        <div className={styles.header}>
          <h2>Analisar Submissão</h2>
          
          {/* === Toggle de Tipo (Dentro do Header) === */}
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

        {/* --- BODY (com scroll) --- */}
        <div className={styles.body}>
          {/* === Formulário Dinâmido === */}
          {fields.map((f) => (
            <div className={styles.formGroup} key={`${formData.tipo}-${f.name}`}>
              <label htmlFor={f.name}>{f.label}{f.required && ' *'}</label>
              
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

        {/* --- FOOTER (com botões) --- */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnGhost} disabled={isSaving}>
            Cancelar
          </button>
          <button onClick={handleReproveClick} className={styles.btnReprovarModal} disabled={isSaving}>
            Reprovar
          </button>
          <button onClick={handleSaveApproveClick} className={styles.btnAprovarModal} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar e Aprovar'}
          </button>
        </div>

      </div>
    </div>
  );
}