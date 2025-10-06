'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cadastro.module.css'; // Importa os estilos locais

export default function CadastroPage() {
  // Estados para controlar os valores de cada input
  const [nome, setNome] = useState('');
  const [ra, setRa] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados para controlar o loading e as mensagens de erro/sucesso
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // A validação de frontend continua aqui, é uma boa prática
    if (senha !== confirmarSenha) {
      setErrors({ confirmarSenha: 'As senhas não coincidem.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/register', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          nome, 
          email, 
          ra, 
          senha,
          confirmarSenha // O campo que faltava
        }), 
      });

      const data = await response.json();

      if (!response.ok) {
        // Agora, se houver outros erros de validação do backend (ex: email duplicado), eles aparecerão aqui
        const errorMessage = data.errors ? data.errors[0].msg : (data.message || 'Erro ao realizar o cadastro.');
        throw new Error(errorMessage);
      }

      alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
      router.push('/login');

    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className={styles.titleSection}>
        <h1>Crie seu cadastro</h1>
      </section>

      <main className={styles.formContainer}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Mostra um erro global, se houver */}
          {errors.global && <p className={styles.errorGlobal}>{errors.global}</p>}

          <div className={styles.field}>
            <label htmlFor="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ra">RA *</label>
            <input
              type="text"
              id="ra"
              name="ra"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              required
              minLength="13"
              maxLength="13"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha">Senha *</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength="8"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmarSenha">Confirmar Senha *</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
            {/* Mostra o erro específico de confirmação de senha */}
            {errors.confirmarSenha && <small className={styles.errorField}>{errors.confirmarSenha}</small>}
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar-se'}
          </button>
        </form>
      </main>
    </>
  );
}