import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useMediaQuery } from './use-media-query';

export function AppShell({ children }: { children: ReactNode }) {
  const isNarrow = useMediaQuery('(max-width: 1023.98px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isNarrow) setSidebarOpen(false);
  }, [isNarrow]);

  useEffect(() => {
    if (!isNarrow || !sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNarrow, sidebarOpen]);

  const showOverlay = isNarrow && sidebarOpen;

  return (
    <div className="app-layout">
      <Sidebar
        isNarrow={isNarrow}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      {showOverlay && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className="main">
        <Topbar
          isNarrow={isNarrow}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
