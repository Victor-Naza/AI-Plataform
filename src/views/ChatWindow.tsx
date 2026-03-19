import { useEffect, useRef } from 'react';
import { IMessage } from '../models/Message';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  messages: IMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isInputDisabled?: boolean;
  inputPlaceholder?: string;
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading = false,
  isInputDisabled = false,
  inputPlaceholder,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="w-full max-w-3xl space-y-6 text-center">
              <h2 className="text-2xl font-bold text-app-text">
                Como posso ajudar voce hoje?
              </h2>
              <p className="text-app-muted">
                Digite sua mensagem abaixo para comecar uma conversa
              </p>
              <div className="pt-2 text-left">
                <ChatInput
                  onSend={onSendMessage}
                  disabled={isLoading || isInputDisabled}
                  placeholder={inputPlaceholder}
                  variant="floating"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-4 bg-app-bg p-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-assistant">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-text border-t-transparent" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 font-semibold text-app-text">
                    Assistente
                  </div>
                  <div className="text-app-muted">
                    Pensando...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading || isInputDisabled}
          placeholder={inputPlaceholder}
        />
      )}
    </div>
  );
}
