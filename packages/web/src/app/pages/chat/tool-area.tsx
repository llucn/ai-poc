// Tool Area: the in-page host that renders whatever Client Tool UI is currently
// active (via the tool-area-bridge). Collapsed (zero width) when no tool is
// requesting a UI. When one appears it expands open; the chat column yields
// space smoothly because the Tool Area's actual layout width is transitioned
// (see .chat-tool-area in styles.css), not just a transform. On close it
// collapses back and unmounts once the width transition finishes.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getActiveRequest, subscribeToolArea } from './tool-area-bridge';

export function ToolArea() {
  const active = useSyncExternalStore(subscribeToolArea, getActiveRequest);

  // `content` lags behind `active` so the collapse transition has something to
  // show while it plays. `open` drives the expanded CSS state.
  const [content, setContent] = useState<ReactNode>(null);
  const [open, setOpen] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      // Entry: mount content in the collapsed state, then flip to open on the
      // next frame so the browser animates from collapsed -> open (setting both
      // in the same frame would skip the transition).
      setContent(active.render(active.settle));
      rafRef.current = requestAnimationFrame(() => setOpen(true));
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }
    // Exit: collapse now; onTransitionEnd unmounts the content afterward.
    setOpen(false);
    return undefined;
  }, [active]);

  if (!content) return null;

  return (
    <aside
      className={`chat-tool-area ${open ? 'chat-tool-area--open' : ''}`}
      role="complementary"
      aria-label="Tool"
      onTransitionEnd={(e) => {
        // Only react to the aside's own width transition (ignore inner content
        // transitions bubbling up), and only once it has finished collapsing.
        if (e.target !== e.currentTarget) return;
        if (!open) setContent(null);
      }}
    >
      <div className="chat-tool-area-inner">{content}</div>
    </aside>
  );
}
