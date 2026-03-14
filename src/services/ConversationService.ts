import { Conversation } from '../models/Conversation';

export interface IConversationService {
  getAllConversations(conversations: Conversation[]): Conversation[];
  sortConversationsByDate(conversations: Conversation[]): Conversation[];
  getRecentConversations(conversations: Conversation[], limit: number): Conversation[];
}

class ConversationService implements IConversationService {
  getAllConversations(conversations: Conversation[]): Conversation[] {
    return [...conversations];
  }

  sortConversationsByDate(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  getRecentConversations(conversations: Conversation[], limit: number = 10): Conversation[] {
    return this.sortConversationsByDate(conversations).slice(0, limit);
  }
}

export const conversationService = new ConversationService();
