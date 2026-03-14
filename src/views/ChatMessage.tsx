import { Bot, User } from 'lucide-react';
import { IMessage } from '../models/Message';

interface ChatMessageProps {
  message: IMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex bg-app-bg p-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl gap-4 ${isUser ? 'flex-row-reverse text-right' : ''}`}>
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            isUser ? 'bg-brand text-app-text' : 'bg-assistant text-app-text'
          }`}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        <div className="space-y-2">
          <div className="font-semibold text-app-text">
            {isUser ? 'Voce' : 'Assistente'}
          </div>
          <div className="whitespace-pre-wrap text-app-muted">{message.content}</div>
        </div>
      </div>
    </div>
  );
}
