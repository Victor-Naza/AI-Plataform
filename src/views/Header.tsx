import { Menu } from 'lucide-react';

type HeaderView = 'chat' | 'agents' | 'profile' | 'settings';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
  activeView: HeaderView;
}

export function Header({
  onMenuClick,
  showMenuButton,
  activeView,
}: HeaderProps) {
  const isChatView = activeView === 'chat';

  return (
    <header className="flex items-center justify-between gap-3 border-b border-app-border bg-app-bg px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showMenuButton ? (
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 transition-colors hover:bg-app-surface"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-app-icon" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          <h1 className="text-xl font-semibold text-app-text">Luminous AI</h1>
        </div>
      </div>
      {!isChatView && <div className="h-9 w-9" />}
    </header>
  );
}
