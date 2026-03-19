import { Menu } from 'lucide-react';
import type { Agent } from '../models/Agent';
import type {
  LlmModelOption,
  LlmProviderId,
  LlmProviderOption,
} from '../models/LlmProvider';

type HeaderView = 'chat' | 'agents' | 'profile' | 'settings';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
  providerOptions: LlmProviderOption[];
  modelOptions: LlmModelOption[];
  agentOptions: Agent[];
  selectedProviderId: LlmProviderId | '';
  selectedModelId: string;
  selectedAgentId: string;
  onProviderChange: (providerId: LlmProviderId) => void;
  onModelChange: (modelId: string) => void;
  onAgentChange: (agentId: string) => void;
  isProvidersLoading: boolean;
  isAgentsLoading: boolean;
  providerError?: string;
  activeView: HeaderView;
}

export function Header({
  onMenuClick,
  showMenuButton,
  providerOptions,
  modelOptions,
  agentOptions,
  selectedProviderId,
  selectedModelId,
  selectedAgentId,
  onProviderChange,
  onModelChange,
  onAgentChange,
  isProvidersLoading,
  isAgentsLoading,
  providerError,
  activeView,
}: HeaderProps) {
  const selectedAgent = agentOptions.find((agent) => agent.id === selectedAgentId);
  const selectedModel = modelOptions.find((model) => model.id === selectedModelId);
  const helperText = providerError
    ? providerError
    : selectedAgent
      ? `${selectedAgent.name} ativo`
      : selectedModel
        ? `${selectedModel.label}${selectedModel.description ? ` - ${selectedModel.description}` : ''}`
        : isProvidersLoading
          ? 'Carregando configuracao...'
          : 'Selecione um modelo';
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
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {isChatView && (
          <div className="flex flex-wrap items-center gap-3">
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
                    {provider.label}
                  </option>
                ))
              )}
            </select>

            <select
              value={selectedModelId}
              onChange={(event) => onModelChange(event.target.value)}
              disabled={isProvidersLoading || !selectedProviderId || modelOptions.length === 0}
              className="min-w-56 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Selecionar versao do modelo"
            >
              {modelOptions.length === 0 ? (
                <option value="">Sem modelos disponiveis</option>
              ) : (
                modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                    {model.description ? ` - ${model.description}` : ''}
                  </option>
                ))
              )}
            </select>

            <select
              value={selectedAgentId}
              onChange={(event) => onAgentChange(event.target.value)}
              disabled={isAgentsLoading || !selectedProviderId}
              className="min-w-44 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Selecionar agente"
            >
              <option value="">Sem agente</option>
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
