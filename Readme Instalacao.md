
# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, construída com uma arquitetura moderna de serviços. O projeto consiste em uma API RESTful (backend) desenvolvida em Node.js e Express, e uma interface de usuário reativa (frontend) desenvolvida com React e Next.js.

-----

## 🛠️ Stack de Tecnologias

### Backend (API)

* **Node.js + Express**: Construção da API REST.
* **MySQL com `mysql2/promise`**: Conexão e queries assíncronas com o banco de dados.
* **JSON Web Token (`jsonwebtoken`)**: Autenticação e gerenciamento de sessões seguras.
* **`bcryptjs`**: Criptografia (hash) de senhas.
* **`cors`**: Habilita a comunicação segura entre o frontend (`http://localhost:3000`) e o backend.
* **`cookie-parser`**: Interpreta os cookies de sessão enviados pelo navegador.
* **`dotenv`**: Gerenciamento de variáveis de ambiente.
* **`express-validator`**: Validação e sanitização dos dados recebidos nas rotas de cadastro.
* **`nodemailer`**: Envio de e-mails automáticos (redefinição de senha, ativação/confirmação de conta).
* **`uuid`**: Geração de tokens únicos (UUID v4) para ativação e redefinição.
* **Padrão Builder**: Utilizado para a construção controlada e flexível de objetos `Usuario` com diferentes perfis (`comum`, `professor`, `bibliotecario`, `admin`).

### Frontend (Interface do Usuário)

* **React**: Biblioteca para construção de interfaces de usuário dinâmicas.
* **Next.js (App Router)**: Framework React com renderização no servidor/cliente, otimizações e roteamento baseado em ficheiros.
* **CSS Modules**: Para estilização de componentes de forma escopada.
* **React Icons**: Biblioteca para inclusão de ícones populares (ex: `react-icons/bs`).
* **SweetAlert2**: Para exibição de modais e alertas interativos.
* **`jose` (Opcional, para Middleware)**: Biblioteca para verificação de JWTs no Edge Runtime do Next.js (se implementar proteção de rotas via Middleware).

-----

## ✅ Pré-requisitos

* **Node.js** (versão LTS recomendada, v22+ utilizada nos testes)
* **npm** (gerenciador de pacotes, vem com o Node.js)
* **MySQL Server** (instalado localmente ou via Docker)
* **Git** (para clonar o repositório)
* **(Obrigatório) Conta Gmail com "App Passwords" habilitado:** Necessária para o envio de e-mails com Nodemailer via Gmail SMTP. Consulte [como gerar App Passwords](https://support.google.com/accounts/answer/185833).

-----

## 🗄️ Banco de Dados

1.  **Crie o banco de dados e as tabelas** executando o script SQL consolidado abaixo no seu cliente MySQL. Este script reflete a estrutura final necessária para todas as funcionalidades implementadas.

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

## 🚀 Instalação e Execução

A aplicação consiste em dois projetos separados (backend e frontend).

### 1\. Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <PASTA_PRINCIPAL_DO_PROJETO>
````

### 2\. Configurar o Backend

1.  Navegue até a pasta do backend:
    ```bash
    cd biblioteca-backend
    ```
2.  Instale as dependências:
    ```bash
    npm install express mysql2 dotenv jsonwebtoken bcryptjs cors cookie-parser express-validator nodemailer uuid
    ```
3.  Crie um ficheiro `.env` na raiz da pasta `biblioteca-backend` e preencha:
    ```dotenv
    # Banco de Dados
    DB_HOST=localhost
    DB_USER=acervo_app
    DB_PASSWORD=123456
    DB_NAME=acervo_digitalv2
    BCRYPT_SALT_ROUNDS=10

    # Aplicação
    PORT=4000
    JWT_SECRET=SUA_CHAVE_SECRETA_FORTE_AQUI # Use algo seguro e longo
    FRONTEND_URL=http://localhost:3000     # URL do seu frontend Next.js

    # Nodemailer (Gmail App Password)
    EMAIL_SERVICE=gmail
    EMAIL_USER=seu_email_gmail@gmail.com
    EMAIL_PASS=pjhs qsil nbkf lkcv
    ```
    > ⚠️ **Use uma App Password** para `EMAIL_PASS`. Gere uma chave `JWT_SECRET` segura.

### 3\. Configurar o Frontend

1.  Volte para a pasta raiz e navegue até a pasta do frontend:
    ```bash
    cd ../biblioteca-frontend
    ```
    *(Ajuste o nome da pasta se necessário)*
2.  Instale as dependências:
    ```bash
    npm install
    # Instale dependências adicionais usadas
    npm install react-icons sweetalert2 jose
    ```
    *(Nota: `jose` é necessário se for usar o Middleware do Next.js para proteção de rotas)*
3.  Crie um ficheiro `.env.local` na raiz da pasta `biblioteca-frontend`:
    ```dotenv
    NEXT_PUBLIC_API_URL=http://localhost:4000/api # URL base da sua API backend
    JWT_SECRET=SUA_CHAVE_SECRETA_FORTE_AQUI     # DEVE SER A MESMA DO BACKEND! (Necessário para Middleware)
    ```

### 4\. Executar a Aplicação

Abra **dois terminais**.

  * **Terminal 1 (Backend):**

    ```bash
    cd caminho/para/biblioteca-backend
    npm start
    ```

    > Aguarde: `🚀 Servidor API rodando na porta 4000`

  * **Terminal 2 (Frontend):**

    ```bash
    cd caminho/para/biblioteca-frontend
    npm run dev
    ```

    > Aguarde: `- Local: http://localhost:3000`

Acesse **http://localhost:3000** no seu navegador.

#### Healthcheck

  * **API:** http://localhost:4000/ -\> Deve retornar JSON simples.
  * **DB:** http://localhost:4000/\_\_dbcheck -\> Deve retornar `{"ok": true}`.

-----

## 🧩 Funcionalidades Implementadas (Backend)

  * **Cadastro Unificado (`POST /api/auth/cadastro`):**
      * Recebe `perfilSolicitado`.
      * **Aluno (`comum`):** Valida RA, cria utilizador como `ativa`, salva hash da senha.
      * **Professor:** Guarda nome, email e hash da senha na `dg_solicitacoes_cadastro`, status `pendente`.
      * Utiliza **Padrão Builder** para construção dos objetos.
      * Validação com `express-validator`.
  * **Login (`POST /api/auth/login`):** Aceita Email ou RA, compara hash `bcrypt`, retorna JWT em cookie `HttpOnly`.
  * **Logout (`POST /api/auth/logout`):** Limpa o cookie JWT.
  * **Verificar Utilizador (`GET /api/auth/current-user`):** Retorna dados do utilizador logado (protegido por `isAuthenticated`).
  * **Atualizar Próprio Perfil (`PUT /api/auth/profile`):** Permite ao utilizador logado alterar `nome` e `email` (com verificação de duplicação de email). Protegido por `isAuthenticated`.
  * **Fluxo de Aprovação Admin (`POST /api/admin/solicitacoes/:id/aprovar`):**
      * Lê solicitação pendente (incluindo `senha_hash` original).
      * Cria o utilizador (Professor) na `dg_usuarios` como `ativa`, usando o hash original.
      * Gera `token_ativacao` (para confirmação de email).
      * Envia email (`sendConfirmationEmail`) com link para `/confirmar-conta`.
      * Protegido por `isAdminOrBibliotecario`.
  * **Fluxo de Criação Direta Admin (`POST /api/admin/usuarios`):**
      * Permite criar Aluno, Bibliotecário, Admin (com senha definida pelo admin).
      * **Professor:** Ignora senha do form, cria utilizador como `pendente_ativacao`, gera `token_ativacao`, envia email (`sendActivationEmail`) com link para `/ativar-conta`.
      * Protegido por `isAdminOrBibliotecario`.
  * **Ativação de Conta (`POST /api/auth/ativar-conta`):**
      * Recebe `token` e `senha`.
      * Verifica token E `status_conta = 'pendente_ativacao'`.
      * Define `senha_hash`, muda `status_conta` para `ativa`, limpa `token_ativacao`.
  * **Confirmação de Conta (`POST /api/auth/confirmar-conta`):**
      * Recebe `token`.
      * Verifica token (qualquer status).
      * Limpa `token_ativacao`.
  * **Recuperação de Senha:**
      * `POST /api/auth/redefinir-senha-solicitacao`: Envia link com `reset_token`.
      * `POST /api/auth/redefinir-senha`: Define nova senha usando `reset_token`.
  * **CRUD de Utilizadores (Admin):**
      * `GET /api/admin/usuarios`: Lista todos (protegido).
      * `GET /api/admin/usuarios/:id`: Detalhes de um (protegido).
      * `PUT /api/admin/usuarios/:id`: Atualiza (nome, email, ra, perfil, status). Inclui validação de RA vs Perfil (protegido).
      * `DELETE /api/admin/usuarios/:id`: Exclui utilizador da `dg_usuarios` e tenta excluir da `dg_solicitacoes_cadastro` (protegido, `isAdmin`).
  * **Proteção de Rotas API:** Middlewares (`isAuthenticated`, `isAdmin`, `isAdminOrBibliotecario`).

-----

## ⚠️ Status Atual e Ajustes Pendentes (Frontend)

O backend possui as funcionalidades centrais implementadas. No entanto, a **integração e finalização no frontend (Next.js)** são cruciais e requerem atenção da equipa:

1.  **Redirecionamento Pós-Login:** A `LoginPage` precisa chamar `router.push` para `/dashboard` ou `/admin/dashboard` após a API retornar sucesso (200 OK), usando o `perfil` da resposta. *(Código base existe, verificar execução)*.
2.  **Fluxo de Redefinição de Senha:** A página de *solicitação* (com campo de email) deve chamar `POST /api/auth/redefinir-senha-solicitacao`. A página de *definição* (com token e nova senha) deve chamar `POST /api/auth/redefinir-senha`. *(Correção de URL necessária na página de solicitação)*.
3.  **Proteção de Páginas Frontend:** Implementar proteção robusta para `/dashboard` e `/admin/dashboard` (e outras rotas privadas) usando **Middleware do Next.js** (recomendado, verificar `JWT_SECRET` no `.env.local`) ou aperfeiçoar a verificação com `useEffect` em cada página protegida para redirecionar se `GET /api/auth/current-user` falhar. *(Implementação parcial com useEffect existe, Middleware é melhor)*.
4.  **Página `/ativar-conta`:** Esta página (para professor criado pelo admin) deve ter formulário para definir senha e chamar `POST /api/auth/ativar-conta`. *(Código base existe, precisa de revisão/teste)*.
5.  **Página `/confirmar-conta`:** Esta página (para professor aprovado via cadastro) deve chamar `POST /api/auth/confirmar-conta` e exibir mensagem/redirecionar. *(Código base existe, precisa de revisão/teste)*.
6.  **Dashboard Utilizador (`/dashboard`):** Implementar o formulário/popup para o utilizador editar o próprio perfil (Nome, Email), chamando `PUT /api/auth/profile`. *(Código base existe, precisa de integração final e CSS)*.
7.  **Painel Admin (`/admin/dashboard`):**
      * Integrar o CSS Module (`dashboard-admin.module.css`).
      * Adicionar botão "Criar Novo Utilizador" que abra um popup/modal.
      * Implementar o formulário e a lógica `fetch` para chamar `POST /api/admin/usuarios`. *(Lógica JS existe, falta botão e popup de criação)*.
      * Testar exaustivamente as funções de Edição (popup) e Exclusão (Swal).
8.  **Títulos das Páginas:** Usar `useEffect` com `document.title = '...'` em cada componente cliente (`'use client'`) ou (preferencialmente) refatorar para usar Server Components pais exportando `metadata`. *(Implementação parcial com useEffect existe)*.

-----

## 🆘 Troubleshooting

  * **`404 Not Found` no Frontend:** Verifique se a URL no `fetch` corresponde **exatamente** à rota definida no backend (`/api/auth/cadastro` vs `/api/auth/register`, etc.).
  * **`401 Unauthorized` / `403 Forbidden`:** Verifique `JWT_SECRET` nos `.env` (devem ser iguais\!), `credentials: 'include'` no `fetch`, e se o perfil do utilizador tem permissão (Middleware).
  * **Erro de CORS:** Confirme `origin: 'http://localhost:3000', credentials: true` no `app.js` (backend).
  * **Erro de envio de e-mail:** Confirme `EMAIL_USER` e `EMAIL_PASS` (App Password) no `.env` (backend). Verifique console do backend.
  * **`TypeError: ... is not a function` (Backend):** Verifique se a função foi definida e **exportada** (`module.exports`) no ficheiro Model ou Controller correspondente.
  * **`ReferenceError: ... is not defined` (Backend):** Verifique se a função/variável foi **importada** (`require`) corretamente no topo do ficheiro.
  * **Erro de Hidratação (Frontend):** Evite espaços/texto entre tags `<tbody>`, `<tr>`, `<td>` nas tabelas JSX.
  * **`Invalid hook call` (Frontend):** Garanta que hooks (`useState`, `useEffect`, `useRouter`) são chamados *dentro* de componentes funcionais React e *depois* da diretiva `'use client';` (se aplicável).
  * **`Failed to parse URL` (Backend):** O backend **não deve** usar `fetch` para chamar as suas próprias rotas. Remova essas chamadas.

-----

## 👥 Contribuição

(Mantido como original)

```bash
git checkout -b feature/nome-da-feature
git add .
git commit -m "feat: descrição"
git push -u origin feature/nome-da-feature
```

Abra um Pull Request.

-----

## 📄 Licença

(Mantido como original)
Projeto acadêmico, desenvolvido para fins educacionais e sem fins comerciais.

```
```