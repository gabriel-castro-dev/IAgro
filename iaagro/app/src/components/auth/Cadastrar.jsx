import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { doCreateUserWithEmailAndPassword } from '../../firebase/auth';
import { useAuth } from '../../authContext';
import AuthShell from './AuthShell';
import { Button, TextField, PasswordField, Checkbox, InlineAlert } from '../ui';
import { LuShieldCheck } from '../ui/icons';
import form from './authForm.module.css';

const Cadastrar = () => {
  const { userLoggedIn } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = acceptedTerms && !isRegistering;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage('Você precisa aceitar os Termos de Uso para continuar.');
      return;
    }
    if (isRegistering) return;

    setIsRegistering(true);
    try {
      await doCreateUserWithEmailAndPassword(email, password);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('A senha é muito fraca.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('E-mail inválido. Verifique o formato.');
      } else {
        setErrorMessage('Erro ao criar conta. Tente novamente.');
      }
      setIsRegistering(false);
    }
  };

  return (
    <AuthShell tagline="Gestão simples para uma lavoura mais previsível.">
      {userLoggedIn && <Navigate to="/home" replace={true} />}

      <span className={`${form.eyebrow} ${form.brass}`}>Comece agora</span>
      <h1 className={form.title}>Crie sua conta</h1>
      <p className={form.subtitle}>Leva menos de dois minutos.</p>

      <form onSubmit={onSubmit} className={form.form} noValidate>
        <TextField
          label="Nome completo"
          type="text"
          autoComplete="name"
          required
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
          placeholder="Gabriel Castro"
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@exemplo.com"
        />

        <div className={form.row2}>
          <PasswordField
            label="Senha"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <PasswordField
            label="Confirmar senha"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            error={passwordsMismatch ? 'As senhas não coincidem.' : undefined}
          />
        </div>

        <span className={form.hintRow}>
          <LuShieldCheck size={18} aria-hidden="true" />
          Use 8 ou mais caracteres, com letras e números.
        </span>

        <Checkbox
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
        >
          Li e concordo com os{' '}
          <Link to="/termo">Termos de Uso</Link> e a{' '}
          <Link to="/termo">Política de Privacidade</Link>.
        </Checkbox>

        {errorMessage && <InlineAlert variant="error">{errorMessage}</InlineAlert>}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isRegistering}
          disabled={!canSubmit}
        >
          {isRegistering ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className={form.footerPrompt}>
        Já possui uma conta?
        <Link to="/">Entrar</Link>
      </p>
    </AuthShell>
  );
};

export default Cadastrar;
