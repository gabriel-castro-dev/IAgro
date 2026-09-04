import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { doConfirmPasswordReset } from '../../firebase/auth';
import AuthShell from './AuthShell';
import { Button, PasswordField, InlineAlert, Spinner } from '../ui';
import { LuArrowLeft, LuCircleCheck, LuCircle } from '../ui/icons';
import form from './authForm.module.css';

const RULES = [
  { key: 'len', label: '8 ou mais caracteres', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Um número', test: (p) => /[0-9]/.test(p) },
];

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // status: verifying | valid | invalid | updated
  const [status, setStatus] = useState('verifying');
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    if (mode !== 'resetPassword' || !code) {
      setStatus('invalid');
      return;
    }

    let active = true;
    verifyPasswordResetCode(auth, code)
      .then(() => {
        if (!active) return;
        setOobCode(code);
        setStatus('valid');
      })
      .catch(() => {
        if (active) setStatus('invalid');
      });
    return () => {
      active = false;
    };
  }, [searchParams]);

  const rulesState = RULES.map((r) => ({ ...r, met: r.test(newPassword) }));
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const allValid = rulesState.every((r) => r.met) && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allValid || isLoading) return;

    setIsLoading(true);
    try {
      await doConfirmPasswordReset(oobCode, newPassword);
      setStatus('updated');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell tagline="Seu trabalho continua. Seu acesso também.">
      <span className={`${form.eyebrow} ${form.brass}`}>Segurança da conta</span>
      <h1 className={form.title}>Crie uma nova senha</h1>

      <div aria-live="polite">
        {status === 'verifying' && (
          <>
            <p className={form.subtitle}>Verificando o link de redefinição...</p>
            <div className={form.form}>
              <Spinner size={24} label="Verificando link" />
            </div>
          </>
        )}

        {status === 'invalid' && (
          <>
            <p className={form.subtitle}>
              Escolha uma senha forte e diferente das anteriores.
            </p>
            <InlineAlert
              variant="error"
              title="Link inválido ou expirado"
              className={form.form}
            >
              Solicite um novo link de redefinição para continuar.
            </InlineAlert>
            <div className={form.form}>
              <Button as={Link} to="/recuperarsenha" size="lg" fullWidth>
                Solicitar novo link
              </Button>
            </div>
          </>
        )}

        {status === 'updated' && (
          <>
            <p className={form.subtitle}>Tudo certo com o seu acesso.</p>
            <InlineAlert
              variant="success"
              title="Senha atualizada"
              className={form.form}
            >
              Redirecionando para o login. Se preferir, entre agora.
            </InlineAlert>
            <div className={form.form}>
              <Button as={Link} to="/" size="lg" fullWidth>
                Ir para o login
              </Button>
            </div>
          </>
        )}

        {status === 'valid' && (
          <>
            <p className={form.subtitle}>
              Escolha uma senha forte e diferente das anteriores.
            </p>

            <form onSubmit={handleSubmit} className={form.form} noValidate>
              <PasswordField
                label="Nova senha"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordField
                label="Confirmar nova senha"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <ul className={form.checklist}>
                {rulesState.map((r) => (
                  <li
                    key={r.key}
                    className={`${form.checkItem} ${r.met ? form.met : ''}`}
                  >
                    {r.met ? <LuCircleCheck size={18} /> : <LuCircle size={18} />}
                    {r.label}
                  </li>
                ))}
                <li className={`${form.checkItem} ${passwordsMatch ? form.met : ''}`}>
                  {passwordsMatch ? <LuCircleCheck size={18} /> : <LuCircle size={18} />}
                  As senhas coincidem
                </li>
              </ul>

              {error && <InlineAlert variant="error">{error}</InlineAlert>}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!allValid}
              >
                {isLoading ? 'Atualizando...' : 'Atualizar senha'}
              </Button>

              <Link to="/" className={form.backLink} style={{ margin: 0 }}>
                <LuArrowLeft size={18} aria-hidden="true" />
                Voltar ao login
              </Link>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default RedefinirSenha;
