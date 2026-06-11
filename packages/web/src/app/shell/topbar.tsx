import { useUser } from '../contexts/UserContext';
import { AvatarMenu } from './avatar-menu';
import { ThemeToggle } from './theme-toggle';
import { TopbarMenu } from './topbar-menu';

type Props = {
  isNarrow: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function Topbar({ isNarrow, sidebarOpen, onToggleSidebar }: Props) {
  const user = useUser();
  const displayName = user?.displayName || 'Guest';

  return (
    <header className="topbar">
      {isNarrow && (
        <button
          type="button"
          className="hamburger"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={sidebarOpen}
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      )}
      <div className="topbar-title">AI Assistant System</div>
      {!isNarrow && <TopbarMenu />}
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <ThemeToggle />
        <span className="topbar-username">{displayName}</span>
        <AvatarMenu />
      </div>
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
