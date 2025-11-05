# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, construída com uma arquitetura moderna de serviços. O projeto consiste em uma API RESTful (backend) desenvolvida em Node.js e Express, e uma interface de usuário reativa (frontend) desenvolvida com React e Next.js.

---

## 🛠️ Stack de Tecnologias

### Backend (API)

* **Node.js + Express**: Construção da API REST.
* **MySQL com mysql2/promise**: Conexão e queries assíncronas com o banco de dados.
* **JSON Web Token (jsonwebtoken)**: Autenticação e gerenciamento de sessões seguras.
* **bcryptjs**: Criptografia (hash) de senhas.
* **CORS**: Habilita a comunicação segura entre o frontend e o backend.
* **cookie-parser**: Interpreta os cookies de sessão enviados pelo navegador.
* **dotenv**: Gerenciamento de variáveis de ambiente.
* **express-validator**: Validação e sanitização dos dados recebidos.
* **nodemailer**: Envio de e-mails automáticos para redefinição de senha.
* **multer**: Upload de arquivos.
* **googleapis**: Integração com o Google Drive (OAuth 2.0).

### Frontend (Interface do Usuário)

* **React**: Biblioteca para construção de interfaces de usuário dinâmicas.
* **Next.js**: Framework React com renderização híbrida, otimizações e roteamento.
* **CSS Modules**: Para estilização de componentes de forma escopada e organizada.
* **React Icons**: Biblioteca para inclusão de ícones populares.

---

## ✅ Pré-requisitos

* **Node.js** (versão LTS recomendada)
* **npm** (gerenciador de pacotes, vem com o Node.js)
* **MySQL Server** (instalado localmente ou via Docker)
* **Git** (para clonar o repositório)
* **Conta Google com acesso ao [Google Cloud Console](https://console.cloud.google.com)** — necessária para a integração com o Google Drive via OAuth.

---

## 🗄️ Banco de Dados

 ```sql
    CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
    USE acervo_digitalv2;

    -- Tabela Principal de Usuários (Estrutura Final)
    CREATE TABLE IF NOT EXISTS dg_usuarios (
      usuario_id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      ra VARCHAR(20) UNIQUE NULL,                     -- RA opcional (VARCHAR permite flexibilidade futura, NULL para não-alunos)
      email VARCHAR(100) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NULL,                   -- NULLABLE: Permite criação pendente de ativação/definição de senha
      perfil ENUM('comum','professor','bibliotecario','admin') NOT NULL DEFAULT 'comum', -- Perfil 'professor' adicionado
      status_conta ENUM('ativa', 'pendente_ativacao', 'inativa') NOT NULL DEFAULT 'ativa', -- Controle granular de status
      token_ativacao VARCHAR(255) UNIQUE NULL,         -- Token para ativação (professor define senha) OU confirmação (professor já tem senha)
      reset_token VARCHAR(255) UNIQUE NULL,            -- Token para redefinição de senha
      reset_token_expira DATETIME NULL                 -- Expiração do token de redefinição
    );

    -- Tabela para Solicitações de Cadastro (Professores/Bibliotecários)
    CREATE TABLE IF NOT EXISTS dg_solicitacoes_cadastro (
      solicitacao_id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      perfil_solicitado ENUM('professor', 'bibliotecario') NOT NULL, -- Perfis que requerem aprovação
      senha_hash VARCHAR(255) NULL,                    -- Guarda o hash da senha original definida no cadastro público
      data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente'
    );

    -- Tabela de Submissões (Mantida)
    CREATE TABLE IF NOT EXISTS dg_submissoes (
      submissao_id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo_proposto VARCHAR(200) NOT NULL,
      descricao TEXT,
      caminho_anexo VARCHAR(255),
      status ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
      revisado_por_id INT NULL,
      data_submissao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id) ON DELETE CASCADE, -- Adicionado ON DELETE CASCADE (ou RESTRICT, dependendo da regra)
      FOREIGN KEY (revisado_por_id) REFERENCES dg_usuarios(usuario_id) ON DELETE SET NULL -- Permite excluir revisor sem apagar submissão
    );

    -- Tabela de Itens Digitais (Mantida)
    CREATE TABLE IF NOT EXISTS dg_itens_digitais (
      item_id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      autor VARCHAR(100),
      ano YEAR,
      descricao TEXT,
      caminho_arquivo VARCHAR(255),
      data_publicacao DATE,
      submissao_id INT UNIQUE NULL,
      FOREIGN KEY (submissao_id) REFERENCES dg_submissoes(submissao_id) ON DELETE SET NULL -- Permite excluir submissão mantendo o item
    );

    -- Tabela de Avaliações (Mantida)
    CREATE TABLE IF NOT EXISTS dg_avaliacoes (
      avaliacao_id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      item_id INT NOT NULL,
      nota TINYINT CHECK (nota BETWEEN 1 AND 5),
      data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id) ON DELETE CASCADE, -- Exclui avaliação se usuário for excluído
      FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id) ON DELETE CASCADE -- Exclui avaliação se item for excluído
    );
    ```
    *(Nota: Adicionadas algumas regras `ON DELETE` nas chaves estrangeiras. Revise se `CASCADE` ou `SET NULL`/`RESTRICT` é o mais apropriado para cada caso.)*

2.  **(Opcional, recomendado)** Crie um utilizador dedicado para a aplicação no MySQL:
    ```sql
    CREATE USER IF NOT EXISTS 'acervo_app'@'localhost' IDENTIFIED BY '123456'; -- Use a senha do seu .env
    GRANT SELECT, INSERT, UPDATE, DELETE ON acervo_digitalv2.* TO 'acervo_app'@'localhost';
    FLUSH PRIVILEGES;
    ```

-----

---

## 🚀 Instalação e Execução

A aplicação consiste em dois projetos separados que precisam ser configurados e executados simultaneamente.

### 1. Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <PASTA_PRINCIPAL_DO_PROJETO>
```

### 2. Configurar o Backend

1. Navegue até a pasta do backend:

```bash
cd biblioteca-backend
```

2. Instale todas as dependências necessárias:

```bash
npm install express mysql2 dotenv jsonwebtoken bcrypt cors cookie-parser express-validator nodemailer multer googleapis
```

3. Crie o arquivo `.env` na raiz da pasta `biblioteca-backend` e preencha com suas credenciais:

```dotenv
# Banco de Dados
DB_HOST=localhost
DB_USER=acervo_app
DB_PASSWORD=TroqueEstaSenha!
DB_DATABASE=acervo_digitalv2
BCRYPT_SALT_ROUNDS=10

# Aplicação
PORT=4000
JWT_SECRET=sua-chave-secreta-super-forte
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Nodemailer (Envio de E-mails)
EMAIL_SERVICE=gmail
EMAIL_USER=bibliotecafatecoriginal@gmail.com
EMAIL_PASS=pjhs qsil nbkf lkcv

# OAuth Google Drive
GOOGLE_OAUTH_CLIENT_ID=433533699237-k167u8iqnr8aco53l5u3c5s8cvmadk84.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/google/oauth2callback

# IDs das pastas no Google Drive
GOOGLE_DRIVE_PENDENTES_ID=1C7EOTDtiltYAtvKTwwWz_-2UWtTQV7Tp
GOOGLE_DRIVE_APROVADOS_ID=1estpWibk4UTuIwaQkQP1_PbnGF2MApby
```

> ⚠️ **Importante:** Se estiver usando Gmail, [ative "App Passwords"](https://support.google.com/accounts/answer/185833) e use a senha gerada no campo `EMAIL_PASS`.

4. Inicie o servidor backend:

```bash
npm start
```

> Aguarde a mensagem: `🚀 API na porta 4000`

### 3. Configurar o Frontend

1. Volte para a pasta raiz e entre no frontend:

```bash
cd ../biblioteca-frontend
```

2. Instale as dependências:

```bash
npm install
npm install react-icons react-bootstrap bootstrap sweetalert2
```

3. Inicie o servidor do frontend:

```bash
npm run dev
```

> Acesse o app em [http://localhost:3000](http://localhost:3000)

### 4. Autorizar o Google Drive (somente na primeira vez)

1. Inicie o backend (`npm start`).
2. Acesse [http://localhost:4000/api/google/auth](http://localhost:4000/api/google/auth)
3. Copie e abra a URL retornada no navegador.
4. Faça login com sua conta Google e clique em **Permitir**.
5. O backend criará `tokens/google-oauth.json` confirmando a autorização.

### 5. Executar a Aplicação (Dois Terminais)

**Terminal 1:**

```bash
cd biblioteca-backend
npm start
```

**Terminal 2:**

```bash
cd biblioteca-frontend
npm run dev
```

> API → [http://localhost:4000](http://localhost:4000)
> Front → [http://localhost:3000](http://localhost:3000)

---

## 🧠 Dicas Rápidas

* **Erro `Failed to fetch`:** verifique se o backend está rodando e se as portas coincidem.
* **Erro de CORS:** confirme que `CORS_ORIGIN` no `.env` é igual à URL do frontend.
* **Upload indo para a raiz do Drive:** verifique o ID da pasta pendente no `.env`.
* **Reautorização do OAuth:** apague `tokens/google-oauth.json` e repita o processo.

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins educacionais, sem fins comerciais.
