const bcrypt = require('bcryptjs');

(async () => {
  const senha = 'SenhaForte123!'; // coloque aqui a senha que VOCÊ quer
  const saltRounds = 10;
  const hash = await bcrypt.hash(senha, saltRounds);
  console.log('HASH GERADO:\n', hash);
})();
