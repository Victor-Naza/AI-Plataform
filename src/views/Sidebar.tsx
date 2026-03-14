import { Plus, MessageSquare, X } from 'lucide-react';
import { IConversation } from '../models/Conversation';

interface SidebarProps {
  conversations: IConversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-app-overlay lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 border-r border-app-border bg-app-bg
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-app-border p-4">
            <button
              onClick={onNewChat}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-app-text transition-colors hover:bg-brand-hover"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Conversa</span>
            </button>
            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-2 hover:bg-app-surface lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-app-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="mt-4 text-center text-sm text-app-muted">
                Nenhuma conversa ainda
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                      ${
                        currentConversationId === conversation.id
                          ? 'bg-brand/15 text-brand'
                          : 'text-app-muted hover:bg-app-surface'
                      }
                    `}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{conversation.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
