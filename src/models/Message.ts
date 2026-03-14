export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class Message implements IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  constructor(id: string, role: 'user' | 'assistant', content: string, timestamp: Date) {
    this.id = id;
    this.role = role;
    this.content = content;
    this.timestamp = timestamp;
  }

  static createUserMessage(content: string): Message {
    return new Message(crypto.randomUUID(), 'user', content, new Date());
  }

  static createAssistantMessage(content: string): Message {
    return new Message(crypto.randomUUID(), 'assistant', content, new Date());
  }
}
