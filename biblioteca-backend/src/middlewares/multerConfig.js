const multer = require('multer');
const path = require('path');

// Configura onde e como salvar os arquivos
const storage = multer.diskStorage({
  // Define a pasta de destino
  destination: (req, file, cb) => {
    // Garante que a pasta 'uploads' exista na raiz do projeto
    // (A rota estática que criaremos apontará para 'src/uploads')
    cb(null, 'src/uploads/'); 
  },
  // Define o nome do arquivo para evitar colisões (nomes iguais)
  filename: (req, file, cb) => {
    // Cria um nome único: timestamp + nome original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// (Opcional, mas recomendado: filtro de arquivos)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
  fileFilter: fileFilter
});

module.exports = upload;