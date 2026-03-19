import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronUp, LogOut, MessageSquare, Settings, UserRound } from 'lucide-react';

type UserMenuView = 'chat' | 'agents' | 'profile' | 'settings';
type UserMenuMode = 'floating' | 'inline';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  activeView: UserMenuView;
  onViewChange: (view: UserMenuView) => void;
  onLogout: () => void;
  mode?: UserMenuMode;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserMenu({
  userName,
  userEmail,
  activeView,
  onViewChange,
  onLogout,
  mode = 'floating',
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(userName);
  const isInline = mode === 'inline';

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const menuItems = [
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
    },
    {
      id: 'agents' as const,
      label: 'Agentes',
      icon: Bot,
    },
    {
      id: 'profile' as const,
      label: 'Perfil',
      icon: UserRound,
    },
    {
      id: 'settings' as const,
      label: 'Configuracoes',
      icon: Settings,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={
        isInline
          ? 'relative w-full'
          : 'fixed bottom-4 left-4 z-40 w-[calc(100vw-2rem)] max-w-xs'
      }
    >
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-full rounded-3xl border border-app-border bg-app-surface p-3 shadow-2xl shadow-black/40">
          <div className="mb-3 border-b border-app-border px-3 pb-3">
            <div className="text-sm font-semibold text-app-text">{userName}</div>
            <div className="mt-1 truncate text-xs text-app-muted">{userEmail}</div>
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-brand/15 text-brand'
                      : 'text-app-muted hover:bg-app-bg hover:text-app-text'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-3xl border border-app-border bg-app-surface px-4 py-3 text-left shadow-xl shadow-black/30 transition-colors hover:border-brand/40"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-sm font-semibold text-brand">
          {initials || 'AI'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-app-text">{userName}</div>
          <div className="truncate text-xs text-app-muted">{userEmail}</div>
        </div>

        <ChevronUp
          className={`h-4 w-4 text-app-muted transition-transform ${
            isOpen ? 'rotate-0' : 'rotate-180'
          }`}
        />
      </button>
    </div>
  );
}
