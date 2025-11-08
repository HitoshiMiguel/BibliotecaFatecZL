// src/services/UserService.js
const { v4: uuidv4 } = require('uuid'); // Biblioteca para gerar IDs únicos (UUIDs)
// NOTA: Certifique-se de ter instalado o 'uuid' no seu projeto (npm install uuid).

/**
 * Utilitário de domínio focado na geração de dados para manipulação de usuários.
 */

// Gera um UUID único que será usado como token de ativação/redefinição
function generateUniqueToken() {
    return uuidv4();
}

module.exports = {
    generateUniqueToken,
};
