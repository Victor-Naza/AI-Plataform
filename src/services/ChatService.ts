import { Conversation } from '../models/Conversation';
import { Message, IMessage } from '../models/Message';
import { LlmProviderId, LlmProvidersConfig } from '../models/LlmProvider';
import { apiService } from './api';

export interface SendMessageParams {
  conversationId: string;
  provider: LlmProviderId;
  messages: Array<Pick<IMessage, 'role' | 'content'>>;
}

export interface IChatService {
  createConversation(title?: string): Conversation;
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
  sendMessage(params: SendMessageParams): Promise<IMessage>;
  getProviders(): Promise<LlmProvidersConfig>;
}

class ChatService implements IChatService {
  createConversation(title: string = 'Nova Conversa'): Conversation {
    return Conversation.create(title);
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
