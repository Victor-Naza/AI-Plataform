import type { IMessage } from '../models/Message';
import type { LlmProviderId, LlmProvidersConfig } from '../models/LlmProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SendMessageRequest {
  conversationId: string;
  provider: LlmProviderId;
  messages: Array<Pick<IMessage, 'role' | 'content'>>;
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

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText) as { error?: string };
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
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
