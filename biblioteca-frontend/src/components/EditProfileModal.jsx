// src/app/components/EditProfileModal.jsx

import React from 'react';
// 1. IMPORTANDO OS ÍCONES QUE FALTAVAM
import { 
  BsPerson, BsEnvelope, BsPersonVcard, BsPersonBadge, 
  BsHourglassSplit, BsSave, BsXCircle 
} from 'react-icons/bs';
import styles from './EditProfileModal.module.css';

const EditProfileModal = ({
  user,
  isOpen,
  onClose,
  setIsEditing,
  profileFormData,
  setProfileFormData,
  handleProfileUpdateSubmit,
  isUpdating
}) => {

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) return null;

  // Função para lidar com a mudança dos inputs do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Função para lidar com o clique em "Salvar Alterações"
  const handleSaveClick = async () => {
    // Chama sua função de submit que já lida com a API e o SweetAlert
    await handleProfileUpdateSubmit(profileFormData);
    // O modal só fecha se a atualização for um sucesso
    // (Sua função handleProfileUpdateSubmit deve cuidar do SweetAlert)
    // Considere fechar o modal apenas se a API retornar sucesso
    onClose(); 
  };

  // Função para lidar com o clique em "Cancelar"
  const handleCancelClick = () => {
    onClose(); // Fecha o modal
    setIsEditing(false); // Garante que o modo de edição seja desativado
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>Editar Perfil</h2>

        {/* 2. CLASSES DE CSS CORRIGIDAS (styles.formGroup) */}
        {/* Campo Nome */}
        <div className={styles.formGroup}>
          <label htmlFor="edit-nome"><BsPerson /> Meu Nome</label>
          <input
            id="edit-nome"
            type="text"
            name="nome"
            value={profileFormData.nome}
            // 3. ONCHANGE CORRIGIDO
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo Email */}
        <div className={styles.formGroup}>
          <label htmlFor="edit-email"><BsEnvelope /> Email</label>
          <input
            id="edit-email"
            type="email"
            name="email"
            value={profileFormData.email}
            // 3. ONCHANGE CORRIGIDO
            onChange={handleChange}
            required
          />
        </div>

        {/* 4. CAMPOS NÃO EDITÁVEIS PADRONIZADOS */}
        {user.ra && (
          <div className={styles.formGroup}>
            <label><BsPersonVcard /> Meu RA</label>
            <input 
              type="text" 
              value={user.ra} 
              disabled // Usando 'disabled' para manter o estilo do form
            />
          </div>
        )}
        <div className={styles.formGroup}>
          <label><BsPersonBadge /> Tipo de Conta</label>
          <input 
            type="text" 
            value={user.perfil} 
            disabled 
          />
        </div>
        <div className={styles.formGroup}>
          <label><BsHourglassSplit /> Status da Conta</label>
          <input 
            type="text" 
            value={user.status_conta || 'ativa'} 
            disabled 
          />
        </div>

        {/* 5. BOTÕES CORRIGIDOS E SEM DUPLICATAS */}
        <div className={styles.buttonGroup}>
          <button 
            className={styles.saveButton} // Classe do modal
            onClick={handleSaveClick} // Função correta
            disabled={isUpdating}
          >
            <BsSave /> {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button 
            className={styles.cancelButton} // Classe do modal
            onClick={handleCancelClick} // Função correta
            disabled={isUpdating}
          >
            <BsXCircle /> Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;