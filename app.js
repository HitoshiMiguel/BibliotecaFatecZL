//bd
require('dotenv').config();

const {body, validationResult} = require('express-validator');
const {renderCadastro, postCadastro} = require('./src/controller/authController');
const express = require('express');
const path = require('path');
const app = express();
const pool = require(require('path').join(__dirname, 'src', 'config', 'db.js'));

// Configurações do Express
app.set('views', path.join(__dirname, 'src', 'views')); // Diretório de views
app.set('view engine', 'ejs'); // Usando EJS como motor de templates

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.urlencoded({extended: true}));

// Rota principal
app.get('/', (req, res) => {
  res.render('index');  // Renderiza 'index.ejs'
});

// cadastro: regras de validação + middleware
const cadastroRules = 
[
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({min: 2, max: 100}).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email').trim().notEmpty().withMessage('E-mail é obrigatório.').isEmail().withMessage('E-mail inválido.').isLength({max: 100}).withMessage('E-mail deve ter no máximo 100 caracteres.'),
  body('ra').trim().customSanitizer(v => (v || '').replace(/\D/g, '')).notEmpty().withMessage('Ra é obrigatório.').matches(/^\d{13}$/).withMessage('RA inserido tem formato incompatível.'),
  body('senha').notEmpty().withMessage('Senha é obrigatória.').isLength({min: 8}).withMessage('Senha deve ter pelo menos 8 caracteres.'),
  body('confirmarSenha').custom
  (
    (v, {req}) => 
    {
      if(v !== req.body.senha) throw new Error('As senhas não coincidem.');
      return true;
    }
  ),
];

function handleValidation(req, res, next)
{
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    const mapped = Object.fromEntries(errors.array().map(e => [e.path, e.msg]));
    return res.status(400).render
    (
      'cadastro',
      {
        old: {nome: req.body.nome || '', ra: req.body.ra || '', email: req.body.email || ''},
        errors: mapped,
        success: null,
      } 
    );
  }
  next();
}

// Rota para 'cadastro.ejs'
app.get('/cadastro', renderCadastro);
app.post('/cadastro', cadastroRules, handleValidation, postCadastro);

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

// teste db
app.get('/__dbcheck', async (req, res) =>
{
  try
  {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ok: rows[0].ok === 1});
  }
  catch (e)
  {
    console.error(e);
    res.status(500).json({ok: false, error: e.message});
  }
})

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
