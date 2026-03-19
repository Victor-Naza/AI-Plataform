import type { LlmProviderId } from './LlmProvider';

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  providerId: LlmProviderId;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPayload {
  name: string;
  description: string;
  providerId: LlmProviderId;
  systemPrompt: string;
}
