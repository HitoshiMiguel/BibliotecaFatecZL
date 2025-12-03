# 📚 Projeto de Modernização da Biblioteca Fatec

> **Plataforma de gestão bibliotecária moderna com arquitetura híbrida e integração Cloud.**

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Drive_API-4285F4?style=for-the-badge&logo=google-drive&logoColor=white)

### 📖 Sobre o Projeto

A **Biblioteca Online da Fatec Zona Leste** é uma solução *Full Stack* robusta desenvolvida para a Fatec Zona Leste. O sistema resolve um desafio complexo de engenharia de software: **modernizar a gestão acadêmica mantendo a integridade de dados de um sistema legado (OpenBiblio).**

Além da gestão do acervo físico, o sistema introduz um **Acervo Digital** integrado à **Google Drive API**, permitindo o upload, streaming e gestão de TCCs e artigos acadêmicos diretamente pela plataforma, com controle de versão e fluxo de aprovação de submissões.

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

----

### 👨‍💻 Autores

Daniel Almeida de Souza || Email: dalmeidadesouza362@gmail.com || Linkedin: https://www.linkedin.com/in/daniel-souza2005/

Eduardo Jimenes Junior || Email: eduardojimenesjunior@gmail.com || Linkedin: https://www.linkedin.com/in/eduardo-jimenes-junior-14837b23b?utm_source=share_via&utm_content=profile&utm_medium=member_ios

Miguel Hitoshi Takahashi || Email: miguelhitoshi@gmail.com || Linkedin: https://www.linkedin.com/in/migueltakahashi

----

Projeto Acadêmico desenvolvido para o curso de **Desenvolvimento de Software Multiplataforma - Fatec Zona Leste**.

