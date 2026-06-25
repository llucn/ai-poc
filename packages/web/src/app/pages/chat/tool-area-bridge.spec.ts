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

  it('select-string-array is registered as a client tool', () => {
    expect(hasClientTool('select-string-array')).toBe(true);
  });

  it('select-string-array resolves with selected options on OK', async () => {
    const promise = renderInToolArea<{ cancelled: boolean; selected: string[] }>(
      (resolve) => {
        // Simulate user selecting options and clicking OK
        resolve({ cancelled: false, selected: ['option-a', 'option-c'] });
        return null;
      }
    );
    const active = getActiveRequest();
    active?.render(active.settle);

    const result = await promise;
    expect(result).toEqual({ cancelled: false, selected: ['option-a', 'option-c'] });
    expect(getActiveRequest()).toBeNull();
  });

  it('select-string-array resolves with cancelled result on Cancel', async () => {
    const promise = renderInToolArea<{ cancelled: boolean; selected: string[] }>(
      (resolve) => {
        // Simulate user clicking Cancel
        resolve({ cancelled: true, selected: [] });
        return null;
      }
    );
    const active = getActiveRequest();
    active?.render(active.settle);

    const result = await promise;
    expect(result).toEqual({ cancelled: true, selected: [] });
    expect(getActiveRequest()).toBeNull();
  });
});
