export type LlmProviderId = 'openai' | 'anthropic';

export const llmProviderLabels: Record<LlmProviderId, string> = {
  openai: 'GPT',
  anthropic: 'Claude',
};

export interface LlmModelOption {
  id: string;
  label: string;
  description?: string;
}

export interface LlmProviderOption {
  id: LlmProviderId;
  label: string;
  defaultModelId?: string;
  models: LlmModelOption[];
}

export interface LlmProvidersConfig {
  providers: LlmProviderOption[];
  defaultProviderId?: LlmProviderId;
}
