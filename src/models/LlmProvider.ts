export type LlmProviderId = 'openai' | 'anthropic';

export interface LlmProviderOption {
  id: LlmProviderId;
  label: string;
  model: string;
}

export interface LlmProvidersConfig {
  providers: LlmProviderOption[];
  defaultProviderId?: LlmProviderId;
}
