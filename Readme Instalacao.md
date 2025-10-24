📚 Biblioteca Fatec ZL

Plataforma digital para modernização da biblioteca acadêmica, construída com uma arquitetura moderna de serviços. O projeto consiste em uma API RESTful (backend) desenvolvida em Node.js e Express, e uma interface de usuário reativa (frontend) desenvolvida com React e Next.js.

🛠️ Stack de Tecnologias

Backend (API)

Node.js + Express: Construção da API REST.

MySQL com mysql2/promise: Conexão e queries assíncronas com o banco de dados.

JSON Web Token (jsonwebtoken): Autenticação e gerenciamento de sessões seguras.

bcryptjs: Criptografia (hash) de senhas.

cors: Habilita a comunicação segura entre o frontend e o backend (configurado para http://localhost:3000).

cookie-parser: Interpreta os cookies de sessão enviados pelo navegador.

dotenv: Gerenciamento de variáveis de ambiente.

express-validator: Validação e sanitização dos dados recebidos nas rotas.

nodemailer: Envio de e-mails automáticos (redefinição de senha, ativação de conta).

uuid: Geração de tokens únicos para ativação e redefinição.

Padrão Builder: Utilizado para a construção robusta e flexível de objetos Usuario com diferentes perfis.

Frontend (Interface do Usuário)

React: Biblioteca para construção de interfaces de usuário dinâmicas.

Next.js: Framework React com renderização híbrida, otimizações e roteamento.

CSS Modules: Para estilização de componentes de forma escopada e organizada.

React Icons: Biblioteca para inclusão de ícones populares.

SweetAlert2: Para exibição de modais e alertas interativos.

✅ Pré-requisitos

Node.js (versão LTS recomendada, v22+ utilizada nos testes)

npm (gerenciador de pacotes, vem com o Node.js)

MySQL Server (instalado localmente ou via Docker)

Git (para clonar o repositório)

(Obrigatório) Conta Gmail com "App Passwords" habilitado: Necessária para o envio de e-mails com Nodemailer via Gmail SMTP. Consulte como gerar App Passwords.

🗄️ Banco de Dados

Crie o banco de dados e as tabelas executando o script SQL consolidado abaixo no seu cliente MySQL. Este script inclui as tabelas de usuários, solicitações, submissões, itens e avaliações, já com as colunas necessárias para os novos fluxos.

CREATE DATABASE IF NOT EXISTS acervo_digitalv2;
USE acervo_digitalv2;

-- Tabela Principal de Usuários (Atualizada)
CREATE TABLE IF NOT EXISTS dg_usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ra VARCHAR(20) UNIQUE NULL,                     -- RA é opcional (VARCHAR para flexibilidade, NULL para não-alunos)
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NULL,                   -- NULLABLE para permitir ativação via token
  perfil ENUM('comum','professor','bibliotecario','admin') NOT NULL, -- Inclui 'professor'
  status_conta ENUM('ativa', 'pendente_ativacao', 'inativa') NOT NULL DEFAULT 'ativa', -- Controle de status
  token_ativacao VARCHAR(255) UNIQUE NULL,         -- Token para ativação de conta (professores)
  reset_token VARCHAR(255) UNIQUE NULL,            -- Token para redefinição de senha
  reset_token_expira DATETIME NULL                 -- Expiração do token de redefinição
);

-- Tabela para Solicitações de Cadastro (Professores/Bibliotecários)
CREATE TABLE IF NOT EXISTS dg_solicitacoes_cadastro (
  solicitacao_id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,              -- Garante que o email da solicitação seja único
  perfil_solicitado ENUM('professor', 'bibliotecario') NOT NULL, -- Perfis que requerem aprovação
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
  revisado_por_id INT NULL, -- Permite NULL se ainda não revisado
  data_submissao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
  FOREIGN KEY (revisado_por_id) REFERENCES dg_usuarios(usuario_id)
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
  submissao_id INT UNIQUE NULL, -- Permite NULL se não veio de submissão
  FOREIGN KEY (submissao_id) REFERENCES dg_submissoes(submissao_id)
);

-- Tabela de Avaliações (Mantida)
CREATE TABLE IF NOT EXISTS dg_avaliacoes (
  avaliacao_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  item_id INT NOT NULL,
  nota TINYINT CHECK (nota BETWEEN 1 AND 5),
  data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES dg_usuarios(usuario_id),
  FOREIGN KEY (item_id) REFERENCES dg_itens_digitais(item_id)
);


(Opcional, recomendado) Crie um usuário dedicado para a aplicação no MySQL (se ainda não o fez):

CREATE USER IF NOT EXISTS 'acervo_app'@'localhost' IDENTIFIED BY '123456'; -- Use a senha do seu .env
GRANT SELECT, INSERT, UPDATE, DELETE ON acervo_digitalv2.* TO 'acervo_app'@'localhost';
FLUSH PRIVILEGES;


🚀 Instalação e Execução

A aplicação consiste em dois projetos separados que precisam ser configurados e executados simultaneamente.

1. Clonar o Repositório

git clone <URL_DO_SEU_REPOSITORIO>
cd <PASTA_PRINCIPAL_DO_PROJETO>


2. Configurar o Backend

Navegue até a pasta do backend:

cd biblioteca-backend


Instale todas as dependências do package.json (incluindo as adicionadas):

npm install express mysql2 dotenv jsonwebtoken bcryptjs cors cookie-parser express-validator nodemailer uuid


(Nota: nodemailer já estava incluído na lista original, uuid foi adicionado)

Crie um arquivo .env na raiz da pasta biblioteca-backend e preencha com suas credenciais (exemplo atualizado):

# Configuração do Banco de Dados
DB_HOST=localhost
DB_USER=acervo_app
DB_PASSWORD=123456
DB_NAME=acervo_digitalv2 # Usar DB_NAME ou DB_DATABASE consistentemente
BCRYPT_SALT_ROUNDS=10

# Configuração da Aplicação
PORT=4000
# JWT_SECRET corrigido (sem duplicação)
JWT_SECRET=ESTA_E_UMA_NOVA_CHAVE_SECRETA_PARA_TESTE_123 
# URL do Frontend (IMPORTANTE para links de email)
FRONTEND_URL=http://localhost:3000

# Configuração do Nodemailer (envio de e-mails)
EMAIL_SERVICE=gmail
EMAIL_USER=bibliotecafatecoriginal@gmail.com
# Use a App Password gerada no Gmail aqui
EMAIL_PASS=pjhs qsil nbkf lkcv 


⚠️ Importante: Use uma App Password do Gmail para EMAIL_PASS, não a senha da sua conta. Ajuste JWT_SECRET para algo seguro.

3. Configurar o Frontend

Volte para a pasta raiz e navegue até a pasta do frontend:

cd ../biblioteca-frontend 


(Ajuste o nome da pasta se for diferente)

Instale as dependências:

npm install
# Adicione outras dependências específicas do frontend se necessário
# npm install react-icons sweetalert2 jose # jose é para o middleware do Next.js


(IMPORTANTE) Crie um ficheiro .env.local na raiz da pasta biblioteca-frontend e adicione as variáveis necessárias, especialmente a JWT_SECRET para o middleware (se o estiver a usar):

NEXT_PUBLIC_API_URL=http://localhost:4000/api 
JWT_SECRET=ESTA_E_UMA_NOVA_CHAVE_SECRETA_PARA_TESTE_123 # DEVE SER A MESMA DO BACKEND!


4. Executar a Aplicação (Fluxo de Dois Terminais)

Você precisará de dois terminais abertos.

No Terminal 1 (inicie o Backend):

cd caminho/para/o/projeto/biblioteca-backend
npm start


🕒 Aguarde a mensagem: 🚀 Servidor API rodando na porta 4000

No Terminal 2 (inicie o Frontend):

cd caminho/para/o/projeto/biblioteca-frontend
npm run dev


🕒 Aguarde a mensagem: - Local: http://localhost:3000

Após iniciar os dois servidores, abra seu navegador e acesse a URL do frontend: http://localhost:3000

Healthcheck do Banco de Dados

Para verificar se a API está conectada ao banco, acesse http://localhost:4000/__dbcheck.
→ Deve retornar {"ok": true}.

🧩 Funcionalidades Implementadas (Backend)

Cadastro e Login Unificado:

Rota /api/auth/login aceita Email ou RA.

Rota /api/auth/cadastro usa o campo perfilSolicitado para:

Aluno (comum): Cadastro direto, exige RA.

Professor: Cria uma solicitação pendente para aprovação administrativa.

Utiliza o Padrão Builder para criar objetos Usuario de forma segura.

Autenticação JWT: Tokens seguros em cookies HttpOnly.

Fluxo de Aprovação Administrativa:

Rota /api/admin/solicitacoes (GET) para listar solicitações pendentes (protegida).

Rota /api/admin/solicitacoes/:id/aprovar (POST) para aprovar professores (protegida):

Cria o utilizador na tabela principal com status_conta = 'pendente_ativacao'.

Gera um token_ativacao.

Envia e-mail de ativação com link contendo o token.

Rota /api/admin/solicitacoes/:id/rejeitar (POST) para rejeitar solicitações (protegida).

Criação Direta (Admin):

Rota /api/admin/usuarios (POST) permite que Admins/Bibliotecários criem outros Admins, Bibliotecários ou Alunos diretamente (protegida).

Recuperação de Senha:

Rota /api/auth/redefinir-senha-solicitacao para pedir o link via e-mail.

Rota /api/auth/redefinir-senha para definir a nova senha usando o token.

Ativação de Conta (Professor):

Backend: Gera token e envia e-mail na aprovação.

Frontend: Precisa de uma página /ativar-conta?token=... para o professor definir a senha inicial (implementação pendente no frontend).

Proteção de Rotas: Middlewares (isAuthenticated, isAdmin, isAdminOrBibliotecario) protegem as rotas da API.

⚠️ Status Atual e Problemas Conhecidos (Frontend)

O backend implementa os fluxos de cadastro (Aluno, Professor via aprovação), login, logout, redefinição de senha e ativação de conta (geração de token). No entanto, a integração com o frontend (Next.js) requer ajustes pela equipa de frontend:

Redirecionamento Pós-Login: A página de login do frontend (/login) precisa implementar a lógica router.push('/dashboard') ou router.push('/admin/dashboard') após receber a resposta 200 OK da API, baseando-se no perfil retornado.

Fluxo de Redefinição de Senha: A página frontend de solicitação de redefinição (onde se digita o e-mail) está a chamar a rota errada (/api/auth/redefinir-senha). Precisa ser corrigida para chamar /api/auth/redefinir-senha-solicitacao.

Página de Cadastro: O formulário precisa enviar o campo perfilSolicitado ('aluno' ou 'professor') para o backend. A lógica condicional para ocultar/mostrar/validar o campo RA deve estar funcional.

Proteção de Páginas Frontend: O acesso direto a páginas como /dashboard ou /admin/dashboard pela URL precisa ser protegido no frontend, preferencialmente usando o Middleware do Next.js (verificar cookie token) ou, no mínimo, com useEffect robusto que redirecione rapidamente se a API /api/auth/current-user retornar 401.

Página de Ativação de Conta: É necessário criar a página /ativar-conta no frontend que receba o token da URL, permita ao professor definir a senha e chame uma nova rota da API (ainda a ser criada no backend) para finalizar a ativação.

🆘 Troubleshooting

Failed to fetch / Erro de Rede: Verifique se ambos os servidores (backend e frontend) estão a correr nas portas corretas (4000 e 3000).

Erro de CORS: Confirme origin: 'http://localhost:3000', credentials: true no app.js do backend.

Erro 401 Unauthorized / 403 Forbidden:

Verifique JWT_SECRET nos .env de ambos os projetos.

Confirme credentials: 'include' nas chamadas fetch do frontend para rotas protegidas.

Verifique se o perfil do utilizador tem permissão para a rota (Admin vs. Comum).

Erro de envio de e-mail: Confirme EMAIL_USER e EMAIL_PASS (App Password) no .env do backend. Verifique o console do backend.

{"ok": false} no /__dbcheck: Reveja as variáveis DB_* no .env do backend.

👥 Contribuição

(Mantido como original)

# Crie uma nova branch a partir da main/develop
git checkout -b feature/nome-da-feature
# Desenvolva e adicione seus arquivos
git add .
git commit -m "feat: descrição da funcionalidade adicionada"
# Envie para o repositório remoto
git push -u origin feature/nome-da-feature
