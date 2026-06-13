import { describe, expect, it } from 'vitest';
import {
  executeClientTool,
  hasClientTool,
  registerClientTool,
} from './client-tool-executor';

describe('ClientToolExecutor', () => {
  it('has the built-in console-log-echo tool registered', () => {
    expect(hasClientTool('console-log-echo')).toBe(true);
  });

  it('executes console-log-echo and returns an echo object', async () => {
    const outcome = await executeClientTool('console-log-echo', {
      message: 'echo test',
    });
    expect('result' in outcome).toBe(true);
    const result = (outcome as { result: { echo: string; timestamp: number } })
      .result;
    expect(result.echo).toBe('echo test');
    expect(typeof result.timestamp).toBe('number');
  });

  it('wraps a successful handler result', async () => {
    registerClientTool('ok-tool', () => ({ value: 42 }));
    const outcome = await executeClientTool('ok-tool', {});
    expect(outcome).toEqual({ result: { value: 42 } });
  });

  it('captures a thrown error into { error }', async () => {
    registerClientTool('boom-tool', () => {
      throw new Error('kaboom');
    });
    const outcome = await executeClientTool('boom-tool', {});
    expect(outcome).toEqual({ error: 'kaboom' });
  });

  it('returns an error for an unregistered tool', async () => {
    const outcome = await executeClientTool('does-not-exist', {});
    expect('error' in outcome).toBe(true);
    expect((outcome as { error: string }).error).toContain('does-not-exist');
  });

  it('awaits async handlers', async () => {
    registerClientTool('async-tool', async (p: { n: number }) => {
      await Promise.resolve();
      return p.n * 2;
    });
    const outcome = await executeClientTool('async-tool', { n: 21 });
    expect(outcome).toEqual({ result: 42 });
  });
});
