import { useEffect, useState } from 'react';
import { Bot, Check, Copy, User } from 'lucide-react';
import type { IMessage } from '../models/Message';

interface ChatMessageProps {
  message: IMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

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
          <div
            className={`flex items-center gap-3 ${isUser ? 'justify-end' : 'justify-between'}`}
          >
            <div className="font-semibold text-app-text">
              {isUser ? 'Voce' : 'Assistente'}
            </div>

            {!isUser && (
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                  copyState === 'copied'
                    ? 'border-brand/30 bg-brand/10 text-brand'
                    : copyState === 'error'
                      ? 'border-danger/30 bg-danger/10 text-danger'
                      : 'border-app-border text-app-muted hover:text-app-text'
                }`}
                aria-label="Copiar resposta"
              >
                {copyState === 'copied' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyState === 'copied'
                  ? 'Copiado'
                  : copyState === 'error'
                    ? 'Falhou'
                    : 'Copiar'}
              </button>
            )}
          </div>
          <div className="whitespace-pre-wrap text-app-muted">{message.content}</div>
        </div>
      </div>
    </div>
  );
}
