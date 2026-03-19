import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Bot, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Agent, AgentPayload } from '../models/Agent';
import type { LlmProviderId, LlmProviderOption } from '../models/LlmProvider';
import { llmProviderLabels } from '../models/LlmProvider';

interface AgentsViewProps {
  agents: Agent[];
  providerOptions: LlmProviderOption[];
  isLoading?: boolean;
  selectedAgentId: string;
  onCreateAgent: (payload: AgentPayload) => Promise<void>;
  onUpdateAgent: (agentId: string, payload: AgentPayload) => Promise<void>;
  onDeleteAgent: (agentId: string) => Promise<void>;
  onUseAgent: (agentId: string) => void;
  onBackToChat: () => void;
}

function getProviderChoices(providerOptions: LlmProviderOption[]) {
  const optionsById = new Map(providerOptions.map((provider) => [provider.id, provider]));

  return (Object.keys(llmProviderLabels) as LlmProviderId[]).map((providerId) => {
    const configuredProvider = optionsById.get(providerId);

    return {
      id: providerId,
      label: configuredProvider?.label ?? llmProviderLabels[providerId],
      configured: Boolean(configuredProvider),
    };
  });
}

export function AgentsView({
  agents,
  providerOptions,
  isLoading = false,
  selectedAgentId,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onUseAgent,
  onBackToChat,
}: AgentsViewProps) {
  const providerChoices = getProviderChoices(providerOptions);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState<LlmProviderId>(providerChoices[0]?.id ?? 'openai');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (providerChoices.length > 0 && !providerChoices.some((option) => option.id === providerId)) {
      setProviderId(providerChoices[0].id);
    }
  }, [providerChoices, providerId]);

  const resetForm = () => {
    setEditingAgentId(null);
    setName('');
    setDescription('');
    setProviderId(providerChoices[0]?.id ?? 'openai');
    setSystemPrompt('');
    setError('');
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setName(agent.name);
    setDescription(agent.description);
    setProviderId(agent.providerId);
    setSystemPrompt(agent.systemPrompt);
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (name.trim().length < 3) {
      setError('Informe um nome de agente com pelo menos 3 caracteres.');
      return;
    }

    if (description.trim().length < 8) {
      setError('Informe uma descricao com pelo menos 8 caracteres.');
      return;
    }

    if (systemPrompt.trim().length < 20) {
      setError('Informe instrucoes do agente com pelo menos 20 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AgentPayload = {
        name: name.trim(),
        description: description.trim(),
        providerId,
        systemPrompt: systemPrompt.trim(),
      };

      if (editingAgentId) {
        await onUpdateAgent(editingAgentId, payload);
      } else {
        await onCreateAgent(payload);
      }

      resetForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel salvar o agente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    setDeletingAgentId(agentId);

    try {
      await onDeleteAgent(agentId);

      if (editingAgentId === agentId) {
        resetForm();
      }
    } finally {
      setDeletingAgentId(null);
    }
  };

  return (
    <section className="flex-1 overflow-y-auto bg-app-bg px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
        <article className="rounded-3xl border border-app-border bg-app-surface p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-app-text">
                {editingAgentId ? 'Editar agente' : 'Novo agente'}
              </h1>
              <p className="mt-2 text-sm text-app-muted">
                Crie instrucoes personalizadas para GPT e Claude e use no chat.
              </p>
            </div>
            {editingAgentId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-app-border px-3 py-2 text-sm text-app-muted transition-colors hover:text-app-text"
              >
                Cancelar
              </button>
            ) : (
              <div className="rounded-xl bg-brand/10 p-3 text-brand">
                <Plus className="h-5 w-5" />
              </div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm text-app-muted">Nome do agente</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Especialista em suporte"
                className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                disabled={isSubmitting || isLoading}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-app-muted">LLM</span>
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value as LlmProviderId)}
                className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                disabled={isSubmitting || isLoading}
              >
                {providerChoices.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}{option.configured ? '' : ' (nao configurado)'}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-app-muted">Descricao</span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explique rapidamente para que este agente serve"
                className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                disabled={isSubmitting || isLoading}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-app-muted">Prompt do agente</span>
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Defina a personalidade, regras e objetivo deste agente"
                rows={10}
                className="w-full resize-y rounded-2xl border border-app-border bg-app-bg px-4 py-3 outline-none transition-colors focus:border-brand"
                disabled={isSubmitting || isLoading}
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full rounded-2xl bg-brand px-4 py-3 font-medium text-app-text transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-app-disabled"
            >
              {isSubmitting
                ? 'Salvando...'
                : editingAgentId
                  ? 'Atualizar agente'
                  : 'Criar agente'}
            </button>
          </form>
        </article>

        <div className="space-y-4">
          <div className="rounded-3xl border border-app-border bg-app-surface p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-app-text">Agentes criados</h2>
                <p className="mt-2 text-sm text-app-muted">
                  Selecione um agente para usar no chat ou ajuste o prompt quando precisar.
                </p>
              </div>

              <button
                type="button"
                onClick={onBackToChat}
                className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2 text-sm text-app-muted transition-colors hover:text-app-text"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao chat
              </button>
            </div>
          </div>

          {agents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-app-border bg-app-surface p-10 text-center">
              <Bot className="mx-auto mb-4 h-10 w-10 text-brand" />
              <h3 className="text-lg font-semibold text-app-text">
                Nenhum agente criado ainda
              </h3>
              <p className="mt-2 text-sm text-app-muted">
                Crie o primeiro agente personalizado para uma das LLMs.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {agents.map((agent) => (
                <article
                  key={agent.id}
                  className="rounded-3xl border border-app-border bg-app-surface p-6"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-app-text">{agent.name}</h3>
                        {selectedAgentId === agent.id && (
                          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand">
                            Em uso
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-app-muted">{agent.description}</p>
                    </div>

                    <span className="rounded-full border border-app-border px-3 py-1 text-xs text-app-muted">
                      {llmProviderLabels[agent.providerId]}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-app-border bg-app-bg p-4">
                    <p className="line-clamp-5 whitespace-pre-wrap text-sm text-app-muted">
                      {agent.systemPrompt}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onUseAgent(agent.id)}
                      className="rounded-xl bg-brand px-4 py-2 text-sm text-app-text transition-colors hover:bg-brand-hover"
                    >
                      Usar no chat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(agent)}
                      className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2 text-sm text-app-muted transition-colors hover:text-app-text"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deletingAgentId === agent.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingAgentId === agent.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
