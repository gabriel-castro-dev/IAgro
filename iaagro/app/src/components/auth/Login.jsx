import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { doSignInWithEmailAndPassword } from '../../firebase/auth';
import { useAuth } from '../../authContext';
import AuthShell from './AuthShell';
import { Button, TextField, PasswordField, Checkbox, InlineAlert } from '../ui';
import form from './authForm.module.css';

const Login = () => {
  const { userLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSigningIn) return;
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await doSignInWithEmailAndPassword(email, password);
    } catch (error) {
      setErrorMessage(mapAuthError(error));
      setIsSigningIn(false);
    }
  };

  return (
    <AuthShell
      image="/assets/backgrounds/auth-login-field.png"
      imagePosition="50% 55%"
      tagline="Decisões melhores começam no campo."
    >
      {userLoggedIn && <Navigate to="/home" replace={true} />}

      <span className={`${form.eyebrow} ${form.green}`}>Bem-vindo de volta</span>
      <h1 className={form.title}>Acesse sua propriedade</h1>
      <p className={form.subtitle}>
        Entre para acompanhar sua operação, clima e produtividade.
      </p>

      <form onSubmit={onSubmit} className={form.form} noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@exemplo.com"
        />

        <PasswordField
          label="Senha"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
        />

        <div className={form.between}>
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            Lembrar de mim
          </Checkbox>
          <Link to="/recuperarsenha" className={form.mutedLink}>
            Esqueci minha senha
          </Link>
        </div>

        {errorMessage && <InlineAlert variant="error">{errorMessage}</InlineAlert>}

        <Button type="submit" size="lg" fullWidth loading={isSigningIn}>
          {isSigningIn ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className={form.footerPrompt}>
        Ainda não tem uma conta?
        <Link to="/cadastrar">Criar conta</Link>
      </p>
    </AuthShell>
  );
};

function mapAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/invalid-email':
      return 'E-mail inválido. Verifique o formato.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente em instantes.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export default Login;
