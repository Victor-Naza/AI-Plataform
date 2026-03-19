import type { IMessage } from '../models/Message';
import type { LlmProviderId, LlmProvidersConfig } from '../models/LlmProvider';
import type { Agent, AgentPayload } from '../models/Agent';
import { getStoredAuthToken } from './authStorage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SendMessageRequest {
  conversationId: string;
  provider: LlmProviderId;
  modelId?: string;
  messages: Array<Pick<IMessage, 'role' | 'content'>>;
  instructions?: string;
}

export interface SendMessageResponse {
  message: IMessage;
}

export interface GetConversationsResponse {
  conversations: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface GetMessagesResponse {
  messages: IMessage[];
}

export interface GetAgentsResponse {
  agents: Agent[];
}

export interface MutateAgentResponse {
  agent: Agent;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const authToken = getStoredAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProviders(): Promise<LlmProvidersConfig> {
    return this.request<LlmProvidersConfig>('/providers');
  }

  async getAgents(): Promise<GetAgentsResponse> {
    return this.request<GetAgentsResponse>('/agents');
  }

  async createAgent(payload: AgentPayload): Promise<MutateAgentResponse> {
    return this.request<MutateAgentResponse>('/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAgent(agentId: string, payload: AgentPayload): Promise<MutateAgentResponse> {
    return this.request<MutateAgentResponse>(`/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  async getConversations(): Promise<GetConversationsResponse> {
    return this.request<GetConversationsResponse>('/conversations');
  }

  async getMessages(conversationId: string): Promise<GetMessagesResponse> {
    return this.request<GetMessagesResponse>(`/conversations/${conversationId}/messages`);
  }

  async createConversation(title: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();

export async function parseErrorResponse(response: Response) {
  const errorText = await response.text();
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;

  try {
    const errorData = JSON.parse(errorText) as { error?: string };
    errorMessage = errorData.error || errorMessage;
  } catch {
    errorMessage = errorText || errorMessage;
  }

  return errorMessage;
}
