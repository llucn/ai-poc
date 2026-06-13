// Tool Area bridge: lets a Client Tool handler (a plain async function with no
// React context) render a React component into the in-page Tool Area and
// resolve its Promise from that component.
//
// Why a module-level store: handlers run outside React (they're invoked by
// executeClientTool), but the Tool Area is a React component owned by ChatPage.
// A tiny subscribe/emit store with a SINGLE active slot bridges the two:
//   - handler calls renderInToolArea(render) -> gets a Promise
//   - the subscribed ToolArea re-renders, calls render(resolve) to get the node
//   - the node calls resolve(result) -> the Promise settles, slot clears,
//     ToolArea collapses
// The single slot matches the serial suspend/resume loop (one Client Tool runs
// at a time), so there is never more than one active request.

import type { ReactNode } from 'react';

// A render function receives the resolve callback and returns the node to show
// in the Tool Area. The result type is whatever the tool resolves with.
export type ToolAreaRender<T> = (resolve: (result: T) => void) => ReactNode;

interface ActiveRequest {
  render: ToolAreaRender<unknown>;
  settle: (result: unknown) => void;
}

let active: ActiveRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/**
 * Subscribe to active-request changes. Returns an unsubscribe function.
 * Used by the ToolArea host component (via useSyncExternalStore).
 */
export function subscribeToolArea(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Current active request (or null). Stable reference between emits so it is
 * safe as a useSyncExternalStore snapshot.
 */
export function getActiveRequest(): ActiveRequest | null {
  return active;
}

/**
 * Render a component into the Tool Area and resolve when it calls back.
 * Returns a Promise that settles with the tool's result. If a request is
 * already active (shouldn't happen with the serial loop), the previous one is
 * cancelled defensively so the Tool Area never gets stuck.
 */
export function renderInToolArea<T>(render: ToolAreaRender<T>): Promise<T> {
  if (active) {
    // Defensive: the serial loop should prevent this. Don't leave a dangling
    // request — just clear it; its awaiter will never resolve, but a newer
    // tool should win the single slot.
    // eslint-disable-next-line no-console
    console.warn('[ToolArea] Replacing an already-active tool UI request');
    active = null;
  }
  return new Promise<T>((resolve) => {
    const settle = (result: unknown) => {
      // Clear first so the ToolArea collapses, then resolve the handler.
      if (active && active.settle === settle) active = null;
      emit();
      resolve(result as T);
    };
    active = { render: render as ToolAreaRender<unknown>, settle };
    emit();
  });
}

/**
 * Force-clear the active request without resolving (used as a safety net when
 * a turn errors). Collapses the Tool Area. The handler's Promise is left
 * pending — callers that force-clear are abandoning the turn.
 */
export function clearToolArea(): void {
  if (active) {
    active = null;
    emit();
  }
}
