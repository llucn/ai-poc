import { describe, expect, it } from 'vitest';
import { buildAnthropicTool, DEFAULT_MAX_TOKENS } from './llm.service';

describe('buildAnthropicTool', () => {
  it('uses an object schema as input_schema when provided', () => {
    const t = buildAnthropicTool('mcp__1__getWeather', 'desc', {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    });
    expect(t.name).toBe('mcp__1__getWeather');
    expect(t.description).toBe('desc');
    expect(t.input_schema).toEqual({
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    });
  });

  it('defaults to an empty object schema when parameters is null', () => {
    const t = buildAnthropicTool('mcp__1__noargs', null, null);
    expect(t.input_schema).toEqual({ type: 'object', properties: {} });
  });

  it('defaults to an empty object schema when parameters is not an object schema', () => {
    const t = buildAnthropicTool('mcp__1__weird', null, 'not-a-schema');
    expect(t.input_schema).toEqual({ type: 'object', properties: {} });
  });

  it('omits description when null', () => {
    const t = buildAnthropicTool('mcp__1__x', null, {
      type: 'object',
      properties: {},
    });
    expect(t).not.toHaveProperty('description');
  });

  it('preserves prefixed names so routing is unchanged', () => {
    expect(
      buildAnthropicTool('client__7__select-users', null, null).name
    ).toBe('client__7__select-users');
  });
});

describe('DEFAULT_MAX_TOKENS', () => {
  it('is a positive integer', () => {
    expect(Number.isInteger(DEFAULT_MAX_TOKENS)).toBe(true);
    expect(DEFAULT_MAX_TOKENS).toBeGreaterThan(0);
  });
});
