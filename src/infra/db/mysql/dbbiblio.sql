USE acervo_digitalv2;

-- Usuários
CREATE TABLE dg_usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ra VARCHAR(20) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('comum','bibliotecario','admin') NOT NULL
);

-- Submissões
CREATE TABLE dg_submissoes (
  submissao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo_proposto VARCHAR(200) NOT NULL,
  descricao TEXT,
  caminho_anexo VARCHAR(255),
  status ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  revisado_por_id INT,
  data_submissao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
  FOREIGN KEY (revisado_por_id) REFERENCES dg_usuarios(usuario_id)
);

-- Itens Digitais
CREATE TABLE dg_itens_digitais (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(100),
  ano YEAR,
  descricao TEXT,
  caminho_arquivo VARCHAR(255),
  data_publicacao DATE,
  submissao_id INT UNIQUE,
  FOREIGN KEY (submissao_id) REFERENCES dg_submissoes(submissao_id)
);

-- Avaliações (sem comentário)
CREATE TABLE dg_avaliacoes (
  avaliacao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  item_id INT NOT NULL,
  nota TINYINT CHECK (nota BETWEEN 1 AND 5),
  data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
  FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id)
);

-- Dados de teste
INSERT INTO dg_usuarios (nome, ra, email, senha_hash, perfil) VALUES
('Admin Master','202312345','admin@acervo.com','123456','admin'),
('Maria Souza','202398765','maria@biblioteca.com','123456','bibliotecario'),
('João Silva','202355555','joao@gmail.com','123456','comum');

INSERT INTO dg_submissoes (usuario_id, titulo_proposto, descricao, status) VALUES
(3,'História do Brasil','Livro introdutório sobre período colonial','pendente');

INSERT INTO dg_itens_digitais (titulo, descricao, autor, ano, submissao_id, data_publicacao) VALUES
('História do Brasil','PDF sobre a história do Brasil colonial','João Silva',2022,1,'2022-01-01');

INSERT INTO dg_avaliacoes (usuario_id, item_id, nota) VALUES (3,1,5);

-- conferência rápida
SHOW TABLES;
SELECT * FROM dg_usuarios;
SELECT * FROM dg_submissoes;
SELECT * FROM dg_itens_digitais;
SELECT * FROM dg_avaliacoes;

