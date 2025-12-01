# 📚 Biblioteca Fatec ZL - Acervo Digital v2 (Híbrido)

Plataforma de gestão bibliotecária moderna, desenvolvida para modernizar o acervo acadêmico da Fatec Zona Leste. O sistema opera em arquitetura híbrida, integrando um novo sistema de gestão acadêmica com o legado (OpenBiblio), além de utilizar armazenamento em nuvem via Google Drive API.

-----

## 🛠️ Stack de Tecnologias

O projeto utiliza uma arquitetura moderna baseada em JavaScript/TypeScript de ponta a ponta.

### Backend (API RESTful)
* **Runtime & Framework:** Node.js, Express (v5).
* **Banco de Dados:**
    * `mysql2`: Driver de alta performance para o banco principal.
    * `sequelize`: ORM utilizado para integração com o sistema legado.
* **Autenticação:** `jsonwebtoken` (JWT), `bcryptjs`, `better-auth`.
* **Integração Cloud (Google Drive):** `googleapis` (OAuth2 e Drive API) para upload e streaming de livros digitais.
* **Jobs & Utilitários:**
    * `node-cron`: Rotinas agendadas (verificação automática de atrasos e multas).
    * `nodemailer`: Disparo de e-mails transacionais.
    * `multer`: Middleware de upload.
    * `express-validator`: Sanitização de dados.

### Frontend (SPA/SSR)
* **Framework:** Next.js 15 (App Router).
* **Core:** React 19.
* **Estilização:** TailwindCSS v4, Bootstrap 5, React-Bootstrap.
* **UI/UX:**
    * `framer-motion`: Animações de interface.
    * `lucide-react` & `react-icons`: Bibliotecas de ícones.
    * `sweetalert2`: Feedback visual e modais.
* **Relatórios & Dados:**
    * `jspdf` & `jspdf-autotable`: Geração de relatórios e carteirinhas em PDF no cliente.
    * `recharts`: Visualização de dados estatísticos.

-----

## ✅ Pré-requisitos

Para executar este projeto localmente, certifique-se de ter instalado:

* **Node.js** (Versão LTS v18 ou superior)
* **MySQL Server** rodando na porta `3306` (Banco de Dados Novo).
* **Ambiente Legado (Docker/XAMPP)** rodando MySQL na porta `3307` (Banco OpenBiblio).
* **Conta Google Cloud Platform** com Drive API habilitada (para obter Client ID e Secret).

-----

## 🗄️ Configuração do Banco de Dados

O sistema requer a criação do banco de dados principal. Execute o script SQL abaixo no seu cliente MySQL (Workbench, DBeaver, etc) conectado à porta **3306**:

```sql
CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
USE acervo_digitalv2;

-- 1. Usuários
CREATE TABLE IF NOT EXISTS dg_usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ra VARCHAR(20) UNIQUE NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NULL,
  perfil ENUM('comum','professor','bibliotecario','admin') NOT NULL DEFAULT 'comum',
  status_conta ENUM('ativa', 'inativa', 'bloqueado', 'pendente_ativacao') NOT NULL DEFAULT 'ativa',
  token_ativacao VARCHAR(255) UNIQUE NULL,
  reset_token VARCHAR(255) UNIQUE NULL,
  reset_token_expira DATETIME NULL,
  bloqueado_ate DATETIME NULL
);

-- 2. Solicitações de Cadastro (Professores/Bibliotecários)
CREATE TABLE IF NOT EXISTS dg_solicitacoes_cadastro (
  solicitacao_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  perfil_solicitado ENUM('professor', 'bibliotecario') NOT NULL,
  senha_hash VARCHAR(255) NULL,
  data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente'
);

-- 3. Submissões (TCCs e Artigos)
CREATE TABLE IF NOT EXISTS dg_submissoes (
  submissao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo_proposto VARCHAR(200) NOT NULL,
  descricao TEXT,
  caminho_anexo VARCHAR(255),
  status ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  revisado_por_id INT NULL,
  data_submissao DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Metadados Acadêmicos
  autor VARCHAR(255) NULL,
  editora VARCHAR(255) NULL,
  ano_publicacao YEAR NULL,
  conferencia VARCHAR(255) NULL,
  periodico VARCHAR(255) NULL,
  instituicao VARCHAR(255) NULL,
  orientador VARCHAR(255) NULL,
  curso VARCHAR(255) NULL,
  ano_defesa YEAR NULL,
  tipo VARCHAR(50) NULL,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id) ON DELETE CASCADE,
  FOREIGN KEY (revisado_por_id) REFERENCES dg_usuarios(usuario_id) ON DELETE SET NULL
);

-- 4. Itens Digitais (Integrado ao Drive)
CREATE TABLE IF NOT EXISTS dg_itens_digitais (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(100),
  ano YEAR,
  descricao TEXT,
  caminho_arquivo VARCHAR(255), -- ID do arquivo no Google Drive
  data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('publicado', 'agendado', 'rascunho') NOT NULL DEFAULT 'publicado',
  total_downloads INT DEFAULT 0,
  tipo VARCHAR(50) NULL,
  submissao_id INT UNIQUE NULL,
  FOREIGN KEY (submissao_id) REFERENCES dg_submissoes(submissao_id) ON DELETE SET NULL
);

-- 5. Avaliações (Híbrido: Digital + Físico)
CREATE TABLE IF NOT EXISTS dg_avaliacoes (
  avaliacao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  item_id INT NULL,      -- NULL se for item do acervo físico
  biblio_id INT NULL,    -- ID de referência ao sistema legado
  nota TINYINT CHECK (nota BETWEEN 1 AND 5),
  data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (usuario_id, item_id)
);

-- 6. Favoritos
CREATE TABLE IF NOT EXISTS dg_favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    item_id INT NULL,
    id_legado INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
    FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id),
    UNIQUE KEY uk_usuario_item (usuario_id, item_id)
);

-- 7. Reservas (Integrado ao OpenBiblio)
CREATE TABLE IF NOT EXISTS dg_reservas (
  reserva_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  legacy_bibid INT NOT NULL,   -- Chave de ligação com OpenBiblio
  codigo_barras VARCHAR(50) NULL,
  titulo VARCHAR(255) NULL,
  status ENUM('ativa','atendida','cancelada','concluida') NOT NULL DEFAULT 'ativa',
  origem ENUM('FISICO') NOT NULL DEFAULT 'FISICO',
  data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_atendimento DATETIME NULL,
  data_prevista_retirada DATE NULL,
  data_prevista_devolucao DATE NULL,
  renovacoes INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_reserva_usuario FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id)
);

-- 8. Notificações
CREATE TABLE IF NOT EXISTS dg_notificacoes (
  notificacao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NULL,
  mensagem TEXT,
  meta JSON NULL,
  enviado BOOLEAN DEFAULT FALSE,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id) ON DELETE SET NULL
);

-- 9. Log de Eventos de Notificação
CREATE TABLE IF NOT EXISTS dg_notificacoes_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave_evento VARCHAR(200) NOT NULL,
  dados JSON NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (chave_evento)
);
````

-----

## 🚀 Instalação e Execução

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### 1\. Configuração do Backend (API)

Navegue até a pasta do servidor e instale as dependências:

```bash
cd biblioteca-backend
npm install bcrypt@6.0.0 bcryptjs@3.0.2 better-auth@1.3.26 bootstrap-icons@1.13.1 cookie-parser@1.4.7 cors@2.8.5 dotenv@17.2.3 ejs@3.1.10 express-validator@7.3.1 express@5.1.0 googleapis@164.1.0 jose@6.1.2 jsonwebtoken@9.0.2 multer@2.0.2 mysql2@3.15.3 node-cron@4.2.1 nodemailer@7.0.10 sequelize@6.37.7 sweetalert2@11.26.2 uuid@13.0.0
npm install -D nodemon@3.1.10
```

Crie um arquivo `.env` na raiz do backend baseado no modelo abaixo:

```dotenv
# --- SERVIDOR ---
PORT=4000
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI

# --- BANCO NOVO (MySQL Local - Porta 3306) ---
DB_NEW_HOST=localhost
DB_NEW_PORT=3306
DB_NEW_USER=acervo_app
DB_NEW_PASSWORD=sua_senha_banco_novo
DB_NEW_DATABASE=acervo_digitalv2

# --- BANCO LEGADO (MySQL Docker - Porta 3307) ---
DB_LEGACY_HOST=localhost
DB_LEGACY_PORT=3307
DB_LEGACY_USER=ob_user
DB_LEGACY_PASSWORD=sua_senha_banco_legado
DB_LEGACY_DATABASE=openbiblio

# --- E-MAIL (Gmail SMTP) ---
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail
FRONTEND_URL=http://localhost:3000

# --- GOOGLE DRIVE INTEGRATION ---
# Obtenha no Google Cloud Console
GOOGLE_OAUTH_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/google/oauth2callback
# IDs das pastas no Drive
GOOGLE_DRIVE_PENDENTES_ID=id_da_pasta_pendentes
GOOGLE_DRIVE_APROVADOS_ID=id_da_pasta_aprovados
```

Para iniciar o servidor (Utilize o terminal da pasta biblioteca-backend):

```bash
npm start
```

### 2\. Configuração do Frontend (Cliente)

Navegue até a pasta da interface e instale as dependências:

```bash
cd ../biblioteca-frontend
npm install autoprefixer@10.4.21 bootstrap@5.3.8 framer-motion@12.23.24 jspdf-autotable@5.0.2 jspdf@3.0.4 lucide-react@0.553.0 multer@2.0.2 next@15.5.4 postcss@8.5.6 react-bootstrap@2.10.10 react-dom@19.1.0 react-icons@5.5.0 react-router-dom@7.9.3 react@19.1.0 recharts@3.5.0 sweetalert2@11.26.2 tailwindcss@4.1.16
```

Crie um arquivo `.env.local` na raiz do frontend:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI # Mesma chave do backend (para Middleware)
```

Para iniciar a interface (Utilize o terminal da pasta biblioteca-frontend)::

```bash
npm run dev
```

Acesse: **http://localhost:3000**

-----

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais no curso de Desenvolvimento de Software Multiplataforma da Fatec Zona Leste.

```
```