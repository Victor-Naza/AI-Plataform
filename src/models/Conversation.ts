import { IMessage, Message } from './Message';

export interface IConversation {
  id: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation implements IConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, title: string, createdAt: Date) {
    this.id = id;
    this.title = title;
    this.messages = [];
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

    const instance = new Conversation(conversation.id, conversation.title, createdAt);
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

  static create(title: string = 'Nova Conversa'): Conversation {
    return new Conversation(crypto.randomUUID(), title, new Date());
  }
}
