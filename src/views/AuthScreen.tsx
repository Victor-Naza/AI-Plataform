import { FormEvent, useState } from 'react';
import type {
  LoginCredentials,
  RegisterPayload,
} from '../services/AuthService';
import {
  passwordRequirementDescription,
  passwordRulePattern,
} from '../utils/passwordRules';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onRegister: (payload: RegisterPayload) => Promise<void>;
  isLoading?: boolean;
}

export function AuthScreen({
  onLogin,
  onRegister,
  isLoading = false,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const actionLabel = mode === 'login' ? 'Entrar' : 'Criar conta';
  const title = mode === 'login' ? 'Login' : 'Cadastro';

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Informe um e-mail valido.');
      return;
    }

    if (!password) {
      setError('Informe a senha.');
      return;
    }

    try {
      if (mode === 'register') {
        if (name.trim().length < 3) {
          setError('Informe um nome com pelo menos 3 caracteres.');
          return;
        }

        if (!passwordRulePattern.test(password)) {
          setError(passwordRequirementDescription);
          return;
        }

        if (password !== confirmPassword) {
          setError('A confirmacao da senha precisa ser igual.');
          return;
        }

        await onRegister({
          name: name.trim(),
          email: normalizedEmail,
          password,
        });
        return;
      }

      await onLogin({
        email: normalizedEmail,
        password,
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel concluir a autenticacao.';

      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8 text-app-text">
      <section className="w-full max-w-xl">
        <div className="w-full rounded-3xl border border-app-border bg-app-surface p-8 shadow-2xl shadow-black/20">
          <div className="mb-8 flex rounded-2xl bg-app-bg p-1">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-brand text-app-text'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-brand text-app-text'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Cadastro
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-app-text">{title}</h2>
            <p className="mt-2 text-sm text-app-muted">
              {mode === 'login'
                ? 'Entre com o e-mail cadastrado para acessar o sistema.'
                : 'Crie sua conta e o perfil sera liberado automaticamente.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="block space-y-2">
                <span className="text-sm text-app-muted">Nome completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                  autoComplete="name"
                  disabled={isLoading}
                />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm text-app-muted">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com"
                className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                autoComplete="email"
                disabled={isLoading}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-app-muted">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isLoading}
              />
            </label>

            {mode === 'register' && (
              <label className="block space-y-2">
                <span className="text-sm text-app-muted">Confirmar senha</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                  className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </label>
            )}

            {error && (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-brand px-4 py-3 font-medium text-app-text transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-app-disabled"
            >
              {isLoading ? 'Processando...' : actionLabel}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
