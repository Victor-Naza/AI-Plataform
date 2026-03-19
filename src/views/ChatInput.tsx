import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'docked' | 'floating';
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  variant = 'docked',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const isFloating = variant === 'floating';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={`block w-full resize-none rounded-3xl border border-app-border px-4 py-3 text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${
            isFloating ? 'bg-app-surface' : 'bg-app-bg'
          }`}
          style={{ minHeight: '52px', maxHeight: '200px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
      </div>
    </form>
  );
}
