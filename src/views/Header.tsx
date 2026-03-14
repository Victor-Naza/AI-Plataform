import { LogOut, Menu, MessageSquare, UserRound } from 'lucide-react';
import { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';

type HeaderView = 'chat' | 'profile';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
  providerOptions: LlmProviderOption[];
  selectedProviderId: LlmProviderId | '';
  selectedProviderModel?: string;
  onProviderChange: (providerId: LlmProviderId) => void;
  isProvidersLoading: boolean;
  providerError?: string;
  activeView: HeaderView;
  onViewChange: (view: HeaderView) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export function Header({
  onMenuClick,
  showMenuButton,
  providerOptions,
  selectedProviderId,
  selectedProviderModel,
  onProviderChange,
  isProvidersLoading,
  providerError,
  activeView,
  onViewChange,
  userName,
  userEmail,
  onLogout,
}: HeaderProps) {
  const helperText = providerError
    ? providerError
    : selectedProviderModel ||
      (isProvidersLoading ? 'Carregando configuracao...' : 'Selecione um modelo');
  const isChatView = activeView === 'chat';

  return (
    <header className="flex flex-col gap-4 border-b border-app-border bg-app-bg px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showMenuButton ? (
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 transition-colors hover:bg-app-surface"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-app-icon" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          <h1 className="text-xl font-semibold text-app-text">Luminous AI</h1>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex rounded-xl border border-app-border p-2 text-app-muted transition-colors hover:border-danger/50 hover:text-danger lg:hidden"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 rounded-2xl border border-app-border bg-app-surface p-1">
          <button
            onClick={() => onViewChange('chat')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              isChatView
                ? 'bg-brand text-app-text'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>

          <button
            onClick={() => onViewChange('profile')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              activeView === 'profile'
                ? 'bg-brand text-app-text'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            <UserRound className="h-4 w-4" />
            Perfil
          </button>
        </div>

        {isChatView && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div
                className={`text-xs ${providerError ? 'text-danger' : 'text-app-muted'}`}
              >
                {helperText}
              </div>
            </div>

            <select
              value={selectedProviderId}
              onChange={(event) => onProviderChange(event.target.value as LlmProviderId)}
              disabled={isProvidersLoading || providerOptions.length === 0}
              className="min-w-40 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Selecionar LLM"
            >
              {providerOptions.length === 0 ? (
                <option value="">Sem LLM configurado</option>
              ) : (
                providerOptions.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label} ({provider.model})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div className="hidden items-center gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-2 lg:flex">
          <div className="text-right">
            <div className="text-sm font-medium text-app-text">{userName}</div>
            <div className="text-xs text-app-muted">{userEmail}</div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex rounded-xl p-2 text-app-muted transition-colors hover:bg-danger/10 hover:text-danger"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
