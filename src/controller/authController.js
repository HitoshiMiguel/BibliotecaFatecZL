// src/controller/authController.js
const bcrypt = require('bcryptjs');
const { findByEmail, findByRA, createUser } = require('../model/UserModel');

// GET /cadastro -> só renderiza o formulário vazio
function renderCadastro(req, res) {
  return res.render('cadastro', { old: {}, errors: {}, success: null });
}

// POST /cadastro -> valida duplicidade, hash e insere
async function postCadastro(req, res) {
  try {
    const { nome, ra, email, senha } = req.body;

    // verifica e-mail duplicado
    const emailExiste = await findByEmail(email);
    if (emailExiste) {
      return res.status(400).render('cadastro', {
        old: { nome, ra, email: '' },
        errors: { email: 'E-mail já cadastrado.' },
        success: null,
      });
    }

    // verifica RA duplicado (se informado)
    const raExiste = await findByRA(ra);
     if (raExiste) {
       return res.status(400).render('cadastro', {
         old: { nome, ra: '', email },
         errors: { ra: 'RA já cadastrado.' },
         success: null,
       });
     }
    

    // gera hash e cria usuário
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const senhaHash = await bcrypt.hash(senha, rounds);

    await createUser({ nome, ra: ra, email, senhaHash });

    // sucesso
    return res.status(201).render('cadastro', {
      old: {},
      errors: {},
      success: 'Conta criada com sucesso! Você já pode fazer login.',
    });
  } catch (err) {
    // erro de UNIQUE (backup contra condição de corrida)
    if (err && err.code === 'ER_DUP_ENTRY') {
      const msg = (err.sqlMessage || '').toLowerCase();
      const errors = {};
      if (msg.includes('email')) errors.email = 'E-mail já cadastrado.';
      else if (msg.includes('ra')) errors.ra = 'RA já cadastrado.';
      else errors.global = 'Registro duplicado. Verifique os dados.';

      return res.status(400).render('cadastro', {
        old: { nome: req.body.nome || '', ra: req.body.ra || '', email: req.body.email || '' },
        errors,
        success: null,
      });
    }

    console.error('Erro no cadastro:', err);
    return res.status(500).render('cadastro', {
      old: { nome: req.body.nome || '', ra: req.body.ra || '', email: req.body.email || '' },
      errors: { global: 'Erro interno ao cadastrar. Tente novamente.' },
      success: null,
    });
  }
}

module.exports = { renderCadastro, postCadastro };
