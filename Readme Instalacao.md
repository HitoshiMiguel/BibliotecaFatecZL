Ah, mil desculpas, Miguel\! Você está certo. Minha falha em não ter colocado o arquivo inteiro.

Aqui está o **README.md completo**, do início ao fim, com todas as seções que você já tinha, mas com as partes da "Stack de Tecnologias" e "Configuração do Projeto" devidamente atualizadas para refletir a adição da biblioteca `react-icons`.

Pode copiar e colar com segurança.

-----

# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, construída com uma arquitetura moderna de serviços. O projeto consiste em uma API RESTful (backend) desenvolvida em Node.js e Express, e uma interface de usuário reativa (frontend) desenvolvida com React e Next.js.

-----

## 🛠️ Stack de Tecnologias

#### Backend (API)

  * **Node.js** + **Express**: Construção da API REST.
  * **MySQL** com **mysql2/promise**: Conexão e queries assíncronas com o banco de dados.
  * **JSON Web Token (jsonwebtoken)**: Autenticação e gerenciamento de sessões seguras.
  * **bcryptjs**: Criptografia (hash) de senhas.
  * **CORS**: Habilita a comunicação segura entre o frontend e o backend.
  * **cookie-parser**: Interpreta os cookies de sessão enviados pelo navegador.
  * **dotenv**: Gerenciamento de variáveis de ambiente.
  * **express-validator**: Validação e sanitização dos dados recebidos.

#### Frontend (Interface do Usuário)

  * **React**: Biblioteca para construção de interfaces de usuário dinâmicas.
  * **Next.js**: Framework React com renderização híbrida, otimizações e roteamento baseado em sistema de arquivos.
  * **CSS Modules**: Para estilização de componentes de forma escopada e organizada.
  * **React Icons**: Biblioteca para inclusão de ícones populares (Bootstrap Icons, Ionicons, etc.).

-----

## ✅ Pré-requisitos

  * [Node.js](https://nodejs.org/) (versão LTS recomendada)
  * npm (gerenciador de pacotes, vem com o Node.js)
  * **MySQL Server** (instalado localmente ou via Docker)
  * Git (para clonar o repositório)

-----

## 🗄️ Banco de Dados

1.  **Criar o banco de dados e as tabelas** (execute o script abaixo no seu cliente MySQL):

    ```sql
    CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
    USE acervo_digitalv2;

    -- Tabela de Usuários
    CREATE TABLE IF NOT EXISTS dg_usuarios (
      usuario_id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      ra CHAR(13) NOT NULL UNIQUE,
      email VARCHAR(100) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      perfil ENUM('comum','bibliotecario','admin') NOT NULL DEFAULT 'comum'
    );

    -- Tabela de Submissões
    CREATE TABLE IF NOT EXISTS dg_submissoes (
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

    -- Tabela de Itens Digitais
    CREATE TABLE IF NOT EXISTS dg_itens_digitais (
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

    -- Tabela de Avaliações
    CREATE TABLE IF NOT EXISTS dg_avaliacoes (
      avaliacao_id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      item_id INT NOT NULL,
      nota TINYINT CHECK (nota BETWEEN 1 AND 5),
      data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
      FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id)
    );
    ```

2.  **(Opcional, recomendado)** **Criar um usuário dedicado** para a aplicação no MySQL:

    ```sql
    CREATE USER IF NOT EXISTS 'acervo_app'@'localhost' IDENTIFIED BY 'TroqueEstaSenha!';
    GRANT SELECT, INSERT, UPDATE ON acervo_digitalv2.* TO 'acervo_app'@'localhost';
    FLUSH PRIVILEGES;
    ```

-----

## 🚀 Instalação e Execução

A aplicação consiste em dois projetos separados que precisam ser configurados e executados simultaneamente.

#### 1\. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_PRINCIPAL_DO_PROJETO>
```

#### 2\. Configurar o Backend

  * Navegue até a pasta do backend:
    ```bash
    cd biblioteca-backend
    ```
  * Instale todas as dependências:
    ```bash
    npm install express mysql2 dotenv jsonwebtoken bcryptjs cors cookie-parser express-validator
    ```
  * Crie um arquivo `.env` na raiz da pasta `biblioteca-backend` e preencha com suas credenciais:
    ```env
    # Configuração do Banco de Dados
    DB_HOST=localhost
    DB_USER=acervo_app
    DB_PASSWORD=TroqueEstaSenha!
    DB_DATABASE=acervo_digitalv2

    # Configuração da Aplicação
    PORT=4000
    JWT_SECRET=sua-chave-secreta-muito-forte-e-dificil-de-adivinhar
    ```

#### 3\. Configurar o Frontend

  * Volte para a pasta raiz e navegue até a pasta do frontend:
    ```bash
    cd ../biblioteca-frontend 
    ```
  * Instale as dependências (o `npm install` padrão deve funcionar, mas para garantir que a biblioteca de ícones seja incluída, rode o comando específico):
    ```bash
    npm install react-icons
    ```

#### 4\. Executar a Aplicação (Fluxo de Dois Terminais)

Você precisará de **dois terminais abertos**.

**No Terminal 1 (inicie o Backend):**

```bash
cd biblioteca-backend
npm start
```

> 🕒 Aguarde a mensagem de confirmação: `🚀 Servidor API rodando na porta 4000`

**No Terminal 2 (inicie o Frontend):**

```bash
cd biblioteca-frontend
npm run dev
```

> 🕒 Aguarde a mensagem de confirmação: `- Local: http://localhost:3000`

Após iniciar os dois servidores, abra seu navegador e acesse a URL do frontend: **[http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)**

**Healthcheck do banco de dados:**
Para verificar se a API está conectada ao banco, abra **[http://localhost:4000/\_\_dbcheck](https://www.google.com/search?q=http://localhost:4000/__dbcheck)** → deve retornar `{"ok": true}`.

-----

## 🧩 Funcionalidades atuais (MVP)

  * **Cadastro e Login de Usuários:**
      * Comunicação via API REST com frontend reativo em Next.js/React.
      * Autenticação baseada em tokens (JWT) com cookies `HttpOnly` para maior segurança.
      * Validações robustas no backend com `express-validator`.
      * Senha armazenada de forma segura como **hash** (usando bcrypt).
      * Login unificado por Email ou RA.
  * **Rotas Protegidas:** O dashboard só pode ser acessado por usuários autenticados.
  * **Logout:** Funcionalidade para invalidar a sessão do usuário.

-----

## 📁 Estrutura do Projeto

O repositório está organizado em uma arquitetura de monorepo com duas pastas principais:

```
.
├─ biblioteca-backend/    # Projeto da API em Node.js/Express
│  ├─ app.js              # Arquivo principal do servidor
│  ├─ .env                # Variáveis de ambiente (local)
│  └─ src/
│     ├─ controller/     # Lógica de negócio (o que fazer)
│     ├─ middleware/     # Funções intermediárias (ex: auth)
│     ├─ model/          # Funções de acesso ao banco de dados
│     └─ routes/         # Definição dos endpoints da API
│
└─ biblioteca-frontend/   # Projeto da Interface em React/Next.js
   └─ src/
     ├─ app/              # Diretório principal de rotas e páginas
     │  ├─ login/
     │  │  └─ page.jsx
     │  └─ cadastro/
     │     └─ page.jsx
     └─ components/       # Componentes reutilizáveis (ex: Header)
```

-----

## 🧪 Testes manuais rápidos

  * Acesse `http://localhost:3000/cadastro`.
  * **Cadastro sem RA** → formulário deve acusar erro.
  * **RA com formato inválido** → backend deve retornar erro `400`.
  * **Duplicar RA/E-mail** → backend deve retornar erro `409 Conflict` (ou similar).
  * **Cadastro válido** → deve redirecionar para a tela de login.
  * **Login válido** → deve redirecionar para o dashboard.
  * **Acessar `/dashboard` sem logar** → deve redirecionar para a tela de login.
  * **Fazer logout** → deve redirecionar para o login e impedir o acesso ao dashboard.

-----

## 🆘 Troubleshooting

  * **`Failed to fetch` no navegador:**
    1.  Verifique se o servidor do **backend** está rodando.
    2.  Confirme se a porta no `fetch` do frontend (ex: `http://localhost:4000`) corresponde à porta em que o backend está rodando (`PORT` no arquivo `.env` do backend).
  * **Erro de CORS no console:**
      * Verifique se a `origin` no `corsOptions` do `app.js` (backend) corresponde exatamente à URL e porta do frontend (ex: `http://localhost:3000`).
  * **Erro `401 Unauthorized` ou redirecionamento para o login:**
      * Verifique se a `JWT_SECRET` está definida no `.env` do backend.
      * Confirme que a opção `credentials: 'include'` está presente nas chamadas `fetch` do frontend que precisam de autenticação.
  * **`{"ok": false}` no healthcheck `/__dbcheck`:**
      * Verifique todas as variáveis `DB_*` no seu arquivo `.env` do backend.

-----

## 👥 Contribuição (Git)

Fluxo sugerido para novas funcionalidades:

```bash
git checkout -b feature/nome-da-feature
# ... desenvolver código ...
git add .
git commit -m "feat: descrição da funcionalidade adicionada"
git push -u origin feature/nome-da-feature
# Abrir um Pull Request no GitHub/GitLab
```

-----

## 📄 Licença

Projeto acadêmico, desenvolvido para fins educacionais e sem fins comerciais.
