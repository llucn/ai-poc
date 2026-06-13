import { describe, expect, it } from 'vitest';
import {
  clearToolArea,
  getActiveRequest,
  renderInToolArea,
  subscribeToolArea,
} from './tool-area-bridge';
// Registering select-users (and the others) via the bootstrap barrel.
import { hasClientTool } from './client-tool-executor';
import './tools';

describe('tool-area-bridge', () => {
  it('select-users is registered as a client tool', () => {
    expect(hasClientTool('select-users')).toBe(true);
  });

  it('exposes the active request after renderInToolArea and clears on settle', async () => {
    let resolveFn: ((v: unknown) => void) | null = null;
    const promise = renderInToolArea<{ ok: boolean }>((resolve) => {
      resolveFn = resolve as (v: unknown) => void;
      return null;
    });

    // Active request is now set; the render fn was invoked to capture resolve.
    const active = getActiveRequest();
    expect(active).not.toBeNull();
    active?.render(active.settle); // invoke render to wire resolveFn
    expect(resolveFn).not.toBeNull();

    // Resolving from the component settles the promise AND clears the slot.
    resolveFn?.({ ok: true });
    await expect(promise).resolves.toEqual({ ok: true });
    expect(getActiveRequest()).toBeNull();
  });

  it('notifies subscribers when a request becomes active and when it settles', async () => {
    let notifications = 0;
    const unsub = subscribeToolArea(() => {
      notifications += 1;
    });

    const promise = renderInToolArea<string>((resolve) => {
      // Simulate Cancel: resolve immediately with a cancelled-style result.
      resolve('cancelled');
      return null;
    });
    // Invoke render with the real settle so the resolve above runs.
    const active = getActiveRequest();
    active?.render(active.settle);

    await promise;
    // At least: one emit on activate, one on settle.
    expect(notifications).toBeGreaterThanOrEqual(2);
    expect(getActiveRequest()).toBeNull();
    unsub();
  });

  it('clearToolArea collapses an active request without resolving', () => {
    renderInToolArea(() => null);
    expect(getActiveRequest()).not.toBeNull();
    clearToolArea();
    expect(getActiveRequest()).toBeNull();
  });
});
