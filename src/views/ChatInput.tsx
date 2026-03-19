import { useState, FormEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

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
    <form
      onSubmit={handleSubmit}
      className={
        isFloating
          ? 'w-full rounded-3xl border border-app-border bg-app-surface/95 p-4 shadow-2xl shadow-black/25 backdrop-blur'
          : 'border-t border-app-border bg-app-bg p-4'
      }
    >
      <div className="mx-auto flex max-w-4xl gap-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-lg border border-app-border px-4 py-3 text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${
            isFloating ? 'bg-app-surface' : 'bg-app-bg'
          }`}
          style={{ minHeight: '52px', maxHeight: '200px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex items-center justify-center rounded-lg bg-brand px-4 py-3 text-app-text transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-app-disabled"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
