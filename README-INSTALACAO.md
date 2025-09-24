---

# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, com interface web e backend em Node.js.

---

## 🛠️ Tecnologias Utilizadas

* **Node.js** – Runtime JavaScript
* **Express.js** – Framework web
* **EJS** – Motor de templates para renderização de views
* **Bootstrap Icons** – Ícones prontos para UI
* **Nodemon** – Monitor de alterações para desenvolvimento

---

## 🚀 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* [npm](https://www.npmjs.com/) (vem junto com o Node.js)
* Git (para clonar o repositório)

---

## 📥 Instalação

1. **Clonar este repositório**

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <PASTA_DO_PROJETO>
   ```

2. **Instalar dependências do projeto**

   ```bash
   npm install
   ```

3. **Instalar pacotes adicionais**

   * EJS (motor de views)

     ```bash
     npm install --save ejs
     ```
   * Bootstrap Icons (biblioteca de ícones)

     ```bash
     npm i bootstrap-icons
     ```
   * Nodemon (monitor de alterações – recomendado para desenvolvimento)

     ```bash
     npm install -g nodemon
     ```

---

## ▶️ Execução do Projeto

* **Rodar com Nodemon** (modo recomendado):

  ```bash
  nodemon app.js
  ```

* **Rodar com Node.js (modo simples)**:

  ```bash
  node app.js
  ```

O servidor estará disponível em:
👉 `http://localhost:3000` (ou na porta configurada no `app.js`)

---

## 👥 Contribuição – Fluxo de Trabalho com Git

### 🔹 Criando uma nova branch e enviando alterações

1. Criar e entrar em uma nova branch:

   ```bash
   git checkout -b nome-da-branch
   ```

2. Fazer alterações no código.

3. Adicionar os arquivos modificados:

   ```bash
   git add .
   ```

4. Criar um commit com mensagem descritiva:

   ```bash
   git commit -m "Descrição da alteração"
   ```

5. Enviar a branch para o GitHub:

   ```bash
   git push origin nome-da-branch
   ```

---

### 🔹 Trabalhando em uma branch já existente

1. Entrar na branch desejada:

   ```bash
   git checkout nome-da-branch
   ```

2. Fazer as alterações necessárias.

3. Adicionar e commitar:

   ```bash
   git add .
   git commit -m "Descrição da alteração"
   ```

4. Enviar as alterações para o GitHub:

   ```bash
   git push origin nome-da-branch
   ```

---

### 🔹 Criando um Pull Request no GitHub

1. Acesse o repositório no GitHub.
2. Você verá uma notificação para abrir um **Pull Request** para a branch recém enviada.
3. Clique em **“Compare & Pull Request”**.
4. Preencha o título e a descrição das alterações.
5. Clique em **“Create Pull Request”**.

👉 O Pull Request será revisado e, após aprovação, mesclado na branch principal (`main`).

---

## 📄 Licença

Este projeto é de uso acadêmico e não possui fins comerciais.

---

