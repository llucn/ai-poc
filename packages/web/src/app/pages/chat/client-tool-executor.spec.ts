import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  defineClientTool,
  executeClientTool,
  getAllClientTools,
  hasClientTool,
} from './client-tool-executor';
// Register built-in tool definitions (console-log-echo) via the bootstrap barrel.
import './tools';

describe('defineClientTool registry', () => {
  it('registers a tool and reports it as present', () => {
    defineClientTool({
      name: 'reg-echo',
      description: 'echo',
      parameters: z.object({ message: z.string() }),
      handler: (p) => ({ echo: p.message }),
    });
    expect(hasClientTool('reg-echo')).toBe(true);
  });

  it('includes the built-in console-log-echo tool', () => {
    expect(hasClientTool('console-log-echo')).toBe(true);
  });

  it('overwrites a tool when redefined with the same name', () => {
    defineClientTool({
      name: 'dup-tool',
      description: 'v1',
      parameters: z.object({}),
      handler: () => 'v1',
    });
    defineClientTool({
      name: 'dup-tool',
      description: 'v2',
      parameters: z.object({}),
      handler: () => 'v2',
    });
    const tools = getAllClientTools();
    expect(tools.filter((t) => t.name === 'dup-tool')).toHaveLength(1);
    expect(tools.find((t) => t.name === 'dup-tool')?.description).toBe('v2');
  });
});

describe('getAllClientTools (zod -> JSON Schema)', () => {
  it('produces a flat JSON Schema with required for non-optional fields', () => {
    defineClientTool({
      name: 'schema-required',
      description: 'd',
      parameters: z.object({ message: z.string().describe('msg') }),
      handler: () => null,
    });
    const tool = getAllClientTools().find((t) => t.name === 'schema-required');
    const schema = tool?.parametersSchema as {
      type: string;
      properties: Record<string, { type: string; description?: string }>;
      required?: string[];
      $ref?: string;
      definitions?: unknown;
    };
    expect(schema.type).toBe('object');
    expect(schema.properties.message.type).toBe('string');
    expect(schema.properties.message.description).toBe('msg');
    expect(schema.required).toContain('message');
    // Flat: no $ref / definitions wrapping.
    expect(schema.$ref).toBeUndefined();
  });

  it('omits optional fields from required', () => {
    defineClientTool({
      name: 'schema-optional',
      description: 'd',
      parameters: z.object({ opt: z.string().optional() }),
      handler: () => null,
    });
    const tool = getAllClientTools().find((t) => t.name === 'schema-optional');
    const schema = tool?.parametersSchema as { required?: string[] };
    expect(schema.required ?? []).not.toContain('opt');
  });
});

describe('executeClientTool', () => {
  it('executes a registered tool and wraps the result', async () => {
    defineClientTool({
      name: 'exec-ok',
      description: 'd',
      parameters: z.object({ n: z.number() }),
      handler: (p) => p.n * 2,
    });
    const outcome = await executeClientTool('exec-ok', { n: 21 });
    expect(outcome).toEqual({ result: 42 });
  });

  it('captures a thrown error into { error }', async () => {
    defineClientTool({
      name: 'exec-boom',
      description: 'd',
      parameters: z.object({}),
      handler: () => {
        throw new Error('kaboom');
      },
    });
    const outcome = await executeClientTool('exec-boom', {});
    expect(outcome).toEqual({ error: 'kaboom' });
  });

  it('returns an error for an unregistered tool', async () => {
    const outcome = await executeClientTool('nope-not-here', {});
    expect('error' in outcome).toBe(true);
    expect((outcome as { error: string }).error).toContain('nope-not-here');
  });

  it('awaits async handlers', async () => {
    defineClientTool({
      name: 'exec-async',
      description: 'd',
      parameters: z.object({ n: z.number() }),
      handler: async (p) => {
        await Promise.resolve();
        return p.n + 1;
      },
    });
    const outcome = await executeClientTool('exec-async', { n: 41 });
    expect(outcome).toEqual({ result: 42 });
  });

  it('console-log-echo returns echo + timestamp', async () => {
    const outcome = await executeClientTool('console-log-echo', {
      message: 'hi',
    });
    const result = (outcome as { result: { echo: string; timestamp: number } })
      .result;
    expect(result.echo).toBe('hi');
    expect(typeof result.timestamp).toBe('number');
  });
});

describe('select-string-array tool registration', () => {
  it('is registered as a client tool', () => {
    expect(hasClientTool('select-string-array')).toBe(true);
  });

  it('emits JSON schema with required options param', () => {
    const tools = getAllClientTools();
    const tool = tools.find((t) => t.name === 'select-string-array');
    expect(tool).toBeDefined();
    const schema = tool?.parametersSchema as {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('options');
    expect(schema.required).toContain('options');
    // Optional params should NOT be in required
    expect(schema.required).not.toContain('title');
    expect(schema.required).not.toContain('multiple');
    expect(schema.required).not.toContain('searchable');
  });
});
