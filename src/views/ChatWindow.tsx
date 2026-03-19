import { useEffect, useRef } from 'react';
import type { Agent } from '../models/Agent';
import type { IMessage } from '../models/Message';
import type { LlmModelOption, LlmProviderId, LlmProviderOption } from '../models/LlmProvider';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

interface ChatWindowProps {
  messages: IMessage[];
  onSendMessage: (content: string) => void;
  providerOptions: LlmProviderOption[];
  modelOptions: LlmModelOption[];
  agentOptions: Agent[];
  selectedProviderId: LlmProviderId | '';
  selectedModelId: string;
  selectedAgentId: string;
  onProviderChange: (providerId: LlmProviderId) => void;
  onModelChange: (modelId: string) => void;
  onAgentChange: (agentId: string) => void;
  isLoading?: boolean;
  isInputDisabled?: boolean;
  isProvidersLoading?: boolean;
  isAgentsLoading?: boolean;
  isProviderSelectionDisabled?: boolean;
  isModelSelectionDisabled?: boolean;
  isAgentSelectionDisabled?: boolean;
  providerError?: string;
  inputPlaceholder?: string;
}

export function ChatWindow({
  messages,
  onSendMessage,
  providerOptions,
  modelOptions,
  agentOptions,
  selectedProviderId,
  selectedModelId,
  selectedAgentId,
  onProviderChange,
  onModelChange,
  onAgentChange,
  isLoading = false,
  isInputDisabled = false,
  isProvidersLoading = false,
  isAgentsLoading = false,
  isProviderSelectionDisabled = false,
  isModelSelectionDisabled = false,
  isAgentSelectionDisabled = false,
  providerError,
  inputPlaceholder,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const providerSelectOptions: CustomSelectOption[] = providerOptions.map((provider) => ({
    value: provider.id,
    label: provider.label,
  }));
  const modelSelectOptions: CustomSelectOption[] = modelOptions.map((model) => ({
    value: model.id,
    label: `${model.label}${model.description ? ` - ${model.description}` : ''}`,
  }));
  const agentSelectOptions: CustomSelectOption[] = [
    { value: '', label: 'Sem agente' },
    ...agentOptions.map((agent) => ({
      value: agent.id,
      label: agent.name,
    })),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatContextPanel = (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-app-border bg-app-surface p-4 text-left shadow-xl shadow-black/10">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-app-muted">
            Agente
          </span>
          <CustomSelect
            value={selectedAgentId}
            options={agentSelectOptions}
            onChange={onAgentChange}
            placeholder="Sem agente"
            disabled={isAgentsLoading || isAgentSelectionDisabled}
            ariaLabel="Selecionar agente"
            triggerClassName="rounded-2xl bg-app-bg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-app-muted">
            LLM
          </span>
          <CustomSelect
            value={selectedProviderId}
            options={providerSelectOptions}
            onChange={(value) => onProviderChange(value as LlmProviderId)}
            placeholder="Sem LLM configurado"
            disabled={isProvidersLoading || isProviderSelectionDisabled || providerOptions.length === 0}
            ariaLabel="Selecionar LLM"
            triggerClassName="rounded-2xl bg-app-bg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-app-muted">
            Geração
          </span>
          <CustomSelect
            value={selectedModelId}
            options={modelSelectOptions}
            onChange={onModelChange}
            placeholder="Sem modelos disponiveis"
            disabled={isProvidersLoading || isModelSelectionDisabled || modelOptions.length === 0}
            ariaLabel="Selecionar geração do modelo"
            triggerClassName="rounded-2xl bg-app-bg"
          />
        </label>
      </div>

      {providerError && (
        <p className="mt-3 text-sm text-danger">{providerError}</p>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="chat-scrollbar flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="w-full max-w-3xl space-y-6 text-center">
              <h2 className="text-2xl font-bold text-app-text">
                Como posso ajudar voce hoje?
              </h2>
              <div className="pt-2">
                {chatContextPanel}
              </div>
              <div>
                <ChatInput
                  onSend={onSendMessage}
                  disabled={isLoading || isInputDisabled}
                  placeholder={inputPlaceholder}
                  variant="floating"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-4 bg-app-bg p-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-assistant">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-text border-t-transparent" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 font-semibold text-app-text">
                    Assistente
                  </div>
                  <div className="text-app-muted">
                    Pensando...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="border-t border-app-border bg-app-bg px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-3">
            {chatContextPanel}
            <ChatInput
              onSend={onSendMessage}
              disabled={isLoading || isInputDisabled}
              placeholder={inputPlaceholder}
            />
          </div>
        </div>
      )}
    </div>
  );
}
