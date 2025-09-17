const express = require('express');
const path = require('path');
const app = express();

// Configurações do Express
app.set('views', path.join(__dirname, 'src', 'views')); // Diretório de views
app.set('view engine', 'ejs'); // Usando EJS como motor de templates

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.render('index');  // Renderiza 'index.ejs'
});

// Rota para 'cadastro.ejs'
app.get('/cadastro', (req, res) => {
  res.render('cadastro');  // Renderiza 'cadastro.ejs'
});

// Rota para 'login.ejs'
app.get('/login', (req, res) => {
  res.render('login');  // Renderiza 'login.ejs'
});

// Rota para 'consulta.ejs'
app.get('/consulta', (req, res) => {
  res.render('consulta');  // Renderiza 'consulta.ejs'
});

// Rota para 'siteFatec.ejs'
app.get('/siteFatec', (req, res) => {
  res.render('siteFatec');  // Renderiza 'siteFatec.ejs'
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
