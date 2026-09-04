import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { doSendPasswordResetEmail } from '../../firebase/auth';
import AuthShell from './AuthShell';
import { Button, TextField, InlineAlert } from '../ui';
import { LuArrowLeft, LuShieldCheck } from '../ui/icons';
import form from './authForm.module.css';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const submit = async (targetEmail) => {
    if (isResetting) return;
    setErrorMessage('');

    if (!isValidEmail(targetEmail)) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    setIsResetting(true);
    try {
      await doSendPasswordResetEmail(targetEmail);
      setSentTo(targetEmail);
      setSent(true);
    } catch (error) {
      switch (error.code) {
        // Não revelar se a conta existe: usuário inexistente também mostra sucesso.
        case 'auth/user-not-found':
          setSentTo(targetEmail);
          setSent(true);
          break;
        case 'auth/invalid-email':
          setErrorMessage('E-mail inválido. Verifique o formato.');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Muitas tentativas. Tente novamente mais tarde.');
          break;
        case 'auth/network-request-failed':
          setErrorMessage('Falha de conexão. Verifique sua internet.');
          break;
        default:
          setErrorMessage('Não foi possível enviar agora. Tente novamente.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AuthShell
      image="/assets/backgrounds/auth-recovery-irrigation.png"
      imagePosition="55% 50%"
      tagline="Tecnologia para decisões que respeitam o campo."
    >
      <Link to="/" className={form.backLink}>
        <LuArrowLeft size={18} aria-hidden="true" />
        Voltar ao login
      </Link>

      {sent ? (
        <>
          <span className={`${form.eyebrow} ${form.green}`}>Verifique seu e-mail</span>
          <h1 className={form.title}>Link enviado</h1>
          <p className={form.subtitle}>
            Se houver uma conta associada a <strong>{maskEmail(sentTo)}</strong>,
            você receberá um link seguro para criar uma nova senha.
          </p>

          <InlineAlert variant="success" className={form.form}>
            O link expira em 60 minutos. Verifique também a caixa de spam.
          </InlineAlert>

          <div className={form.form}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              loading={isResetting}
              onClick={() => submit(sentTo)}
            >
              Reenviar e-mail
            </Button>
            <Button as={Link} to="/" variant="ghost" size="lg" fullWidth>
              Voltar ao login
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className={`${form.eyebrow} ${form.green}`}>Recuperar acesso</span>
          <h1 className={form.title}>Esqueceu sua senha?</h1>
          <p className={form.subtitle}>
            Informe o e-mail da sua conta. Enviaremos um link seguro para criar
            uma nova senha.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(email);
            }}
            className={form.form}
            noValidate
          >
            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
            />

            {errorMessage && <InlineAlert variant="error">{errorMessage}</InlineAlert>}

            <Button type="submit" size="lg" fullWidth loading={isResetting}>
              {isResetting ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            <span className={form.hintRow}>
              <LuShieldCheck size={18} aria-hidden="true" />
              O link expira em 60 minutos.
            </span>
          </form>
        </>
      )}
    </AuthShell>
  );
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function maskEmail(value) {
  const [user, domain] = value.split('@');
  if (!domain) return value;
  const visible = user.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(user.length - 1, 1))}@${domain}`;
}

export default EsqueciSenha;
