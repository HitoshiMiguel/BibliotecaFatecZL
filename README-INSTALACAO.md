# 📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, com interface web e backend em Node.js + MySQL.

---

## 🛠️ Stack

* **Node.js** + **Express**
* **EJS** (views)
* **MySQL** (**mysql2/promise**)
* **dotenv** (variáveis de ambiente)
* **express-validator** (validações)
* **bcryptjs** (hash de senha)
* **nodemon** (dev)

> Ícones/estilos são opcionais — ex.: **Bootstrap Icons** (não obrigatório para rodar o CRUD).

---

## ✅ Pré-requisitos

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* npm (vem com o Node)
* **MySQL Server** (local)
* Git (para clonar)

---

## 🗄️ Banco de Dados

1. **Criar o banco e as tabelas** (no MySQL):

```sql
CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
USE acervo_digitalv2;

-- Usuários
CREATE TABLE IF NOT EXISTS dg_usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ra CHAR(13) NOT NULL UNIQUE,                 -- RA obrigatório (13 dígitos)
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('comum','bibliotecario','admin') NOT NULL DEFAULT 'comum'
);

-- Submissões
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

-- Itens Digitais
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

-- Avaliações
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

> Se já existirem dados e a coluna `ra` não for obrigatória, ajuste após normalizar registros nulos/vazios:
>
> ```sql
> SELECT usuario_id, ra FROM dg_usuarios WHERE ra IS NULL OR ra = '';
> -- Preencha/ajuste antes de:
> ALTER TABLE dg_usuarios MODIFY ra CHAR(13) NOT NULL UNIQUE;
> ```

2. *(Opcional, recomendado)* **Usuário dedicado da app** (privilégios mínimos):

```sql
CREATE USER IF NOT EXISTS 'acervo_app'@'localhost' IDENTIFIED BY 'TroqueEstaSenha!';
GRANT SELECT, INSERT, UPDATE ON acervo_digitalv2.* TO 'acervo_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🔧 Configuração do Projeto

1. **Clonar e entrar na pasta:**

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
```

2. **Instalar dependências:**

```bash
npm install
# caso falte algo, rode:
npm i express ejs mysql2 dotenv express-validator bcryptjs
npm i -D nodemon
```

3. **Variáveis de ambiente (.env):**
   Crie um arquivo `.env` na raiz do projeto com:

```
DB_HOST=localhost
DB_USER=acervo_app
DB_PASSWORD=TroqueEstaSenha!
DB_NAME=acervo_digitalv2
BCRYPT_SALT_ROUNDS=10
PORT=3000
```

> **Importante:** mantenha `.env` fora do Git. Garanta que exista um `.env.example` sem segredos.

---

## ▶️ Execução

### Com script (recomendado)

Adicione no `package.json` (se ainda não tiver):

```json
"scripts": {
  "dev": "nodemon app.js",
  "start": "node app.js"
}
```

Rode:

```bash
npm run dev
```

### Direto

```bash
nodemon app.js
# ou
node app.js
```

Acesse: **[http://localhost:3000](http://localhost:3000)**

**Healthcheck do banco:**
Abra **[http://localhost:3000/__dbcheck](http://localhost:3000/__dbcheck)** → deve retornar `{"ok": true}`.

---

## 🧩 Funcionalidades atuais (MVP)

* **Cadastro de usuário**

  * Campos: `nome`, `ra`, `email`, `senha` (+ confirmar senha na view)
  * **RA obrigatório com 13 dígitos** (ex.: `1111392421034`)
  * `email` e `ra` **únicos**
  * `senha` armazenada como **hash** (bcrypt)
  * Validações no backend com **express-validator**
  * Renderização de erros/sucesso via **EJS**

---

## 📁 Estrutura (resumo)

```
.
├─ app.js
├─ .env              # (local, não commitar)
├─ src/
│  ├─ config/
│  │   └─ db.js
│  ├─ controller/
│  │   └─ authController.js
│  ├─ model/
│  │   └─ UserModel.js
│  ├─ public/
│  │   ├─ CSS/
│  │   └─ imagens/
│  └─ views/
│      ├─ index.ejs
│      ├─ cadastro.ejs
│      ├─ login.ejs
│      └─ consulta.ejs
└─ ...
```

---

## 🧪 Testes manuais rápidos

* **Sem RA** → formulário deve acusar “RA é obrigatório”.
* **RA ≠ 13 dígitos** → acusar “RA deve ter exatamente 13 dígitos.”
* **Duplicar RA/E-mail** → acusar duplicidade.
* **Cadastro válido** → inserir e redirecionar/mensagem de sucesso.

---

## 🆘 Troubleshooting

* `MODULE_NOT_FOUND: mysql2` → `npm i mysql2`.
* `{"ok": false}` em `/__dbcheck` → verifique `.env` (host, usuário, senha, db).
* Erro “first argument must be of type string” ao consultar DB → verifique **ordem dos argumentos** no `pool.query(sql, params)` e **vírgula** entre SQL e array.
* RA rejeitado → garanta que o valor tem **13 dígitos**; no backend usamos sanitizer para manter só dígitos.

---

## 👥 Contribuição (Git)

Fluxo sugerido:

```bash
git checkout -b feature/nome
# código...
git add .
git commit -m "feat: descrição"
git push -u origin feature/nome
# abrir Pull Request no GitHub
```

---

## 📄 Licença

Projeto acadêmico, sem fins comerciais.

