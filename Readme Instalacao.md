Com certeza, Miguel\! Depois de todo esse trabalho, é fundamental ter a documentação atualizada para que qualquer pessoa (incluindo você no futuro) possa instalar e rodar o projeto sem problemas.

Aqui estão as duas coisas que você pediu:

1.  O guia atualizado para o `README.md`, já com os novos comandos.
2.  O "tutorial daora" para enviar essas novas mudanças para o GitHub.

-----

### **1. README.md Atualizado**

O seu template já está excelente e muito profissional. A única parte que precisa de uma pequena atualização é a seção de tecnologias do Frontend e a de instalação, para incluir o `react-icons`.

Copie e cole este conteúdo no seu `README.md`. As mudanças são sutis, mas importantes.

````markdown
# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, construída com uma arquitetura moderna de serviços. O projeto consiste em uma API RESTful (backend) desenvolvida em Node.js e Express, e uma interface de usuário reativa (frontend) desenvolvida com React e Next.js.

---

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
* **Next.js**: Framework React para renderização híbrida, otimizações e roteamento.
* **CSS Modules**: Para estilização de componentes de forma escopada e organizada.
* **React Icons**: Biblioteca para inclusão de ícones populares (Bootstrap Icons, etc.).

---

## ✅ Pré-requisitos

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* npm (gerenciador de pacotes, vem com o Node.js)
* **MySQL Server** (instalado localmente ou via Docker)
* Git (para clonar o repositório)

---

## 🗄️ Banco de Dados

<details>
  <summary><strong>Clique para expandir o Script SQL</strong></summary>
  
  O script SQL para criação do banco de dados e das tabelas permanece o mesmo.
  
  ```sql
  CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
  USE acervo_digitalv2;

  CREATE TABLE IF NOT EXISTS dg_usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ra CHAR(13) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('comum','bibliotecario','admin') NOT NULL DEFAULT 'comum'
  );
  /* ... (outras tabelas) ... */
````

\</details\>

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
  * Instale todas as dependências de uma vez:
    ```bash
    npm install express mysql2 dotenv jsonwebtoken bcryptjs cors cookie-parser express-validator
    ```
  * Crie um arquivo `.env` na raiz da pasta `biblioteca-backend` com o conteúdo abaixo:
    ```env
    # Configuração do Banco de Dados
    DB_HOST=localhost
    DB_USER=root # ou seu usuário do MySQL
    DB_PASSWORD=sua_senha_aqui
    DB_DATABASE=acervo_digitalv2

    # Configuração da Aplicação
    PORT=4000
    JWT_SECRET=crie-uma-chave-secreta-forte-e-aleatoria-aqui
    ```

#### 3\. Configurar o Frontend

  * Volte para a pasta raiz e navegue até a pasta do frontend:
    ```bash
    cd ../biblioteca-frontend 
    ```
  * Instale as dependências, incluindo a de ícones:
    ```bash
    npm install react-icons
    ```
    *(Nota: O Next.js já vem com `react` e `react-dom`, então o `npm install` inicial já deve ter resolvido a maior parte.)*

#### 4\. Executar a Aplicação (Fluxo de Dois Terminais)

Você precisará de **dois terminais abertos**.

**No Terminal 1 (Backend):**

```bash
cd biblioteca-backend
npm start
```

> 🕒 Aguarde a mensagem: `🚀 Servidor API rodando na porta 4000`

**No Terminal 2 (Frontend):**

```bash
cd biblioteca-frontend
npm run dev
```

> 🕒 Aguarde a mensagem: `- Local: http://localhost:3000`

Após iniciar os dois servidores, acesse no seu navegador: **[http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)**

-----

*(O restante do seu README (`Funcionalidades`, `Estrutura`, `Testes`, etc.) já está perfeito e atualizado, não precisa de mudanças)*

````

---
### **2. O "Tutorial Daora" para Enviar as Mudanças ao GitHub**

Agora que o `README.md` está atualizado, vamos enviar todas as suas melhorias de CSS e de documentação para o GitHub.

**Missão:** Sincronizar o trabalho local com o repositório remoto.

#### Passo 1: Prepare uma Nova "Mala de Viagem" (Branch)
É uma boa prática colocar cada conjunto de novas funcionalidades em uma branch separada.

1.  **Sincronize sua branch `main` local:**
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Crie e mude para a nova branch:**
    ```bash
    git checkout -b feature/estilizacao-geral
    ```

#### Passo 2: Verifique e Empacote as Mudanças (`status`, `add`)
1.  **Veja o que mudou:**
    ```bash
    git status
    ```
    > Você verá uma lista de todos os arquivos que modificamos (o `README.md`, os arquivos `.jsx` e `.module.css` do frontend, etc.).
2.  **Adicione tudo à sua "mala":**
    ```bash
    git add .
    ```

#### Passo 3: Etiquete a "Mala" (`commit`)
Dê um nome claro para o seu pacote de mudanças.
```bash
git commit -m "feat: Estiliza páginas de login, cadastro e dashboard"
````

  * `feat:` é uma convenção para "feature" (nova funcionalidade ou melhoria visual).

#### Passo 4: Envie a "Mala" para o Aeroporto (`push`)

Envie sua nova branch e suas mudanças para o GitHub.

```bash
git push -u origin feature/estilizacao-geral
```

#### Passo 5: Peça a Aterrissagem (`Pull Request`)

1.  Vá para a página do seu repositório no GitHub.
2.  Clique no botão verde **"Compare & pull request"** que aparecerá.
3.  Revise as alterações e clique em **"Create pull request"**.
4.  Finalmente, na página do Pull Request, clique em **"Merge pull request"** e confirme.

**Missão Cumprida\!** Seu repositório agora está 100% atualizado com toda a evolução do seu projeto.
