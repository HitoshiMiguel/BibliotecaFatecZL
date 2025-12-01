# 📚 Fatec Library Manager

> **Plataforma de gestão bibliotecária moderna com arquitetura híbrida e integração Cloud.**

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Drive_API-4285F4?style=for-the-badge&logo=google-drive&logoColor=white)

### 📖 Sobre o Projeto

O **Fatec Library Manager** é uma solução *Full Stack* robusta desenvolvida para a Fatec Zona Leste. O sistema resolve um desafio complexo de engenharia de software: **modernizar a gestão acadêmica mantendo a integridade de dados de um sistema legado (OpenBiblio).**

Além da gestão do acervo físico, o sistema introduz um **Acervo Digital** integrado à **Google Drive API**, permitindo o upload, streaming e gestão de TCCs e artigos acadêmicos diretamente pela plataforma, com controle de versão e fluxo de aprovação de submissões.



[Image of system dashboard interface]


---

### ✨ Destaques da Arquitetura

* **Arquitetura Híbrida:** O backend orquestra operações simultâneas no banco de dados novo (MySQL) e no legado (via Sequelize), garantindo que o histórico da biblioteca seja preservado enquanto novas funcionalidades são adicionadas.
* **Gestão de Ativos Digitais (DAM):** Integração via OAuth2 com Google Drive para armazenamento seguro de arquivos PDF (TCCs), sem consumir espaço do servidor da aplicação.
* **Performance:** Frontend construído com **Next.js 15 (App Router)** e **React 19**, utilizando *Server Side Rendering* para carregamento instantâneo.
* **Automação:** Jobs agendados (`node-cron`) verificam atrasos diariamente e disparam notificações automáticas por e-mail.

---

### 🛠️ Stack Tecnológico

O projeto foi construído utilizando as versões mais recentes do ecossistema JavaScript:

#### **Frontend (Client-Side)**
* **Core:** Next.js 15, React 19
* **Estilização:** TailwindCSS v4, Bootstrap 5
* **UX/UI:** Framer Motion (animações), SweetAlert2 (feedback), Lucide React (ícones)
* **Relatórios:** jsPDF (geração de carteirinhas e relatórios no browser)

#### **Backend (Server-Side)**
* **API:** Node.js (LTS v18+), Express v5
* **Banco de Dados:** MySQL 8.0 (Driver `mysql2` + `sequelize` para legado)
* **Segurança:** JWT, BcryptJS, Better-Auth
* **Integrações:** Googleapis (Drive API), Nodemailer (SMTP)

---

### 🗄️ Estrutura do Banco de Dados

O sistema utiliza um banco relacional robusto. Abaixo, o esquema principal das tabelas desenvolvidas:

<details>
<summary><strong>📄 Clique para expandir o Script SQL (Schema)</strong></summary>

```sql
CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
USE acervo_digitalv2;

-- 1. Usuários e Perfis
CREATE TABLE IF NOT EXISTS dg_usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ra VARCHAR(20) UNIQUE NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NULL,
  perfil ENUM('comum','professor','bibliotecario','admin') NOT NULL DEFAULT 'comum',
  status_conta ENUM('ativa', 'inativa', 'bloqueado', 'pendente_ativacao') NOT NULL DEFAULT 'ativa',
  token_ativacao VARCHAR(255) UNIQUE NULL,
  reset_token VARCHAR(255) UNIQUE NULL
);

-- 2. Submissões Acadêmicas (TCCs)
CREATE TABLE IF NOT EXISTS dg_submissoes (
  submissao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo_proposto VARCHAR(200) NOT NULL,
  caminho_anexo VARCHAR(255),
  status ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  -- Metadados Acadêmicos (Autor, Orientador, Ano, etc)
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id)
);

-- 3. Integração Google Drive (Itens Digitais)
CREATE TABLE IF NOT EXISTS dg_itens_digitais (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  caminho_arquivo VARCHAR(255), -- ID do arquivo no Google Drive
  status ENUM('publicado', 'agendado', 'rascunho') NOT NULL DEFAULT 'publicado',
  total_downloads INT DEFAULT 0,
  submissao_id INT UNIQUE NULL,
  FOREIGN KEY (submissao_id) REFERENCES dg_submissoes(submissao_id)
);

-- 4. Reservas Híbridas (Link com OpenBiblio)
CREATE TABLE IF NOT EXISTS dg_reservas (
  reserva_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  legacy_bibid INT NOT NULL,   -- Chave de ligação com OpenBiblio
  status ENUM('ativa','atendida','cancelada','concluida') NOT NULL DEFAULT 'ativa',
  data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id)
);

-- (Tabelas adicionais: Avaliações, Favoritos, Notificações, Logs...)
````

\</details\>

-----

### 🚀 Instalação e Execução

Pré-requisitos: `Node.js v18+`, `MySQL (Porta 3306)` e `Docker/XAMPP` (para o banco legado na porta 3307).

#### 1\. Backend (API)

```bash
cd biblioteca-backend

# Instalação das dependências (Express 5, Google APIs, Sequelize, etc)
npm install bcrypt@6.0.0 better-auth@1.3.26 cookie-parser@1.4.7 cors@2.8.5 dotenv@17.2.3 express@5.1.0 googleapis@164.1.0 jsonwebtoken@9.0.2 multer@2.0.2 mysql2@3.15.3 node-cron@4.2.1 nodemailer@7.0.10 sequelize@6.37.7 sweetalert2@11.26.2 uuid@13.0.0

# Rodar a API
npm start
```

*Nota: Configure o arquivo `.env` com as credenciais do Banco e do Google Cloud Console.*

#### 2\. Frontend (Next.js)

```bash
cd biblioteca-frontend

# Instalação das dependências (Next 15, Tailwind v4, Framer Motion)
npm install autoprefixer@10.4.21 bootstrap@5.3.8 framer-motion@12.23.24 jspdf-autotable@5.0.2 jspdf@3.0.4 lucide-react@0.553.0 multer@2.0.2 next@15.5.4 postcss@8.5.6 react-bootstrap@2.10.10 react-dom@19.1.0 react-icons@5.5.0 react-router-dom@7.9.3 react@19.1.0 recharts@3.5.0 sweetalert2@11.26.2 tailwindcss@4.1.16

# Rodar o cliente
npm run dev
```

O projeto estará acessível em: `http://localhost:3000`

-----

### 👨‍💻 Autor

\<a href="https://www.google.com/search?q=https://github.com/SEU\_USUARIO"\>
\<img style="border-radius: 50%;" src="https://www.google.com/search?q=https://avatars.githubusercontent.com/u/SEU\_ID\_AQUI%3Fv%3D4" width="100px;" alt=""/\>
\<br /\>
\<sub\>\<b\>Miguel Hitoshi Takahashi\</b\>\</sub\>
\</a\>

Desenvolvido para o curso de **Desenvolvimento de Software Multiplataforma - Fatec Zona Leste**.

[](https://www.google.com/search?q=LINK_DO_SEU_LINKEDIN)

```
```