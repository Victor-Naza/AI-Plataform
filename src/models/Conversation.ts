import { IMessage, Message } from './Message';
import type { LlmProviderId } from './LlmProvider';

export interface IConversation {
  id: string;
  title: string;
  messages: IMessage[];
  providerId: LlmProviderId | '';
  modelId: string;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation implements IConversation {
  id: string;
  title: string;
  messages: Message[];
  providerId: LlmProviderId | '';
  modelId: string;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    title: string,
    createdAt: Date,
    providerId: LlmProviderId | '' = '',
    modelId: string = '',
    agentId: string | null = null
  ) {
    this.id = id;
    this.title = title;
    this.messages = [];
    this.providerId = providerId;
    this.modelId = modelId;
    this.agentId = agentId;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateContext(providerId: LlmProviderId | '', modelId: string, agentId: string | null): void {
    this.providerId = providerId;
    this.modelId = modelId;
    this.agentId = agentId;
    this.updatedAt = new Date();
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  static from(conversation: IConversation): Conversation {
    const createdAt =
      conversation.createdAt instanceof Date
        ? conversation.createdAt
        : new Date(conversation.createdAt);
    const updatedAt =
      conversation.updatedAt instanceof Date
        ? conversation.updatedAt
        : new Date(conversation.updatedAt);

    const instance = new Conversation(
      conversation.id,
      conversation.title,
      createdAt,
      conversation.providerId ?? '',
      conversation.modelId ?? '',
      conversation.agentId ?? null
    );
    instance.messages = conversation.messages.map((message) =>
      message instanceof Message
        ? message
        : new Message(
            message.id,
            message.role,
            message.content,
            message.timestamp instanceof Date
              ? message.timestamp
              : new Date(message.timestamp)
          )
    );
    instance.updatedAt = updatedAt;
    return instance;
  }

  static create(
    title: string = 'Nova Conversa',
    providerId: LlmProviderId | '' = '',
    modelId: string = '',
    agentId: string | null = null
  ): Conversation {
    return new Conversation(
      crypto.randomUUID(),
      title,
      new Date(),
      providerId,
      modelId,
      agentId
    );
  }
}
