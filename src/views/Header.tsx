import { Menu } from 'lucide-react';
import { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';

interface HeaderProps {
  onMenuClick: () => void;
  providerOptions: LlmProviderOption[];
  selectedProviderId: LlmProviderId | '';
  selectedProviderModel?: string;
  onProviderChange: (providerId: LlmProviderId) => void;
  isProvidersLoading: boolean;
  providerError?: string;
}

export function Header({
  onMenuClick,
  providerOptions,
  selectedProviderId,
  selectedProviderModel,
  onProviderChange,
  isProvidersLoading,
  providerError,
}: HeaderProps) {
  const helperText = providerError
    ? providerError
    : selectedProviderModel || (isProvidersLoading ? 'Carregando configuracao...' : 'Selecione um modelo');

  return (
    <header className="flex items-center justify-between gap-3 border-b border-app-border bg-app-bg px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-app-surface"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-app-icon" />
        </button>
        <h1 className="text-xl font-semibold text-app-text">
          AI Chat
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <div className={`text-xs ${providerError ? 'text-danger' : 'text-app-muted'}`}>
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
    </header>
  );
}
