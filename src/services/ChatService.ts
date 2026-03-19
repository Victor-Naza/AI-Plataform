import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import type { IMessage } from '../models/Message';
import type { LlmProviderId, LlmProvidersConfig } from '../models/LlmProvider';
import { apiService } from './api';

export interface SendMessageParams {
  conversationId: string;
  provider: LlmProviderId;
  modelId?: string;
  messages: Array<Pick<IMessage, 'role' | 'content'>>;
  instructions?: string;
}

export interface ConversationContext {
  providerId: LlmProviderId | '';
  modelId: string;
  agentId: string | null;
}

export interface IChatService {
  createConversation(title?: string, context?: ConversationContext): Conversation;
  addMessageToConversation(
    conversationId: string,
    message: Message,
    conversations: Conversation[]
  ): Conversation[];
  getConversationById(
    conversationId: string,
    conversations: Conversation[]
  ): Conversation | undefined;
  deleteConversation(conversationId: string, conversations: Conversation[]): Conversation[];
  updateConversationTitle(
    conversationId: string,
    title: string,
    conversations: Conversation[]
  ): Conversation[];
  updateConversationContext(
    conversationId: string,
    context: ConversationContext,
    conversations: Conversation[]
  ): Conversation[];
  sendMessage(params: SendMessageParams): Promise<IMessage>;
  getProviders(): Promise<LlmProvidersConfig>;
}

class ChatService implements IChatService {
  createConversation(
    title: string = 'Nova Conversa',
    context: ConversationContext = { providerId: '', modelId: '', agentId: null }
  ): Conversation {
    return Conversation.create(title, context.providerId, context.modelId, context.agentId);
  }

  addMessageToConversation(
    conversationId: string,
    message: Message,
    conversations: Conversation[]
  ): Conversation[] {
    return conversations.map((conv) => {
      if (conv.id === conversationId) {
        const updatedConv = Conversation.from(conv);
        updatedConv.addMessage(message);
        return updatedConv;
      }
      return conv;
    });
  }

  getConversationById(
    conversationId: string,
    conversations: Conversation[]
  ): Conversation | undefined {
    return conversations.find((conv) => conv.id === conversationId);
  }

  deleteConversation(conversationId: string, conversations: Conversation[]): Conversation[] {
    return conversations.filter((conv) => conv.id !== conversationId);
  }

  updateConversationTitle(
    conversationId: string,
    title: string,
    conversations: Conversation[]
  ): Conversation[] {
    return conversations.map((conv) => {
      if (conv.id === conversationId) {
        const updatedConv = Conversation.from(conv);
        updatedConv.updateTitle(title);
        return updatedConv;
      }
      return conv;
    });
  }

  updateConversationContext(
    conversationId: string,
    context: ConversationContext,
    conversations: Conversation[]
  ): Conversation[] {
    return conversations.map((conv) => {
      if (conv.id === conversationId) {
        const updatedConv = Conversation.from(conv);
        updatedConv.updateContext(context.providerId, context.modelId, context.agentId);
        return updatedConv;
      }

      return conv;
    });
  }

  async sendMessage(params: SendMessageParams): Promise<IMessage> {
    try {
      const response = await apiService.sendMessage(params);
      return response.message;
    } catch (error) {
      console.error('Error sending message:', error);

      if (error instanceof Error && error.message.toLowerCase().includes('sessao')) {
        throw error;
      }

      return Message.createAssistantMessage(
        'Nao foi possivel obter resposta do modelo configurado. Verifique as chaves e o backend local.'
      );
    }
  }

  async getProviders(): Promise<LlmProvidersConfig> {
    return apiService.getProviders();
  }
}

export const chatService = new ChatService();
