import { describe, expect, it } from 'vitest';
import { parseToolName } from './session.service';

describe('parseToolName', () => {
  it('parses a standard mcp tool name', () => {
    expect(parseToolName('mcp__5__getWeatherForecastByLocation')).toEqual({
      prefix: 'mcp',
      toolId: 5,
      toolName: 'getWeatherForecastByLocation',
    });
  });

  it('parses a client tool name', () => {
    expect(parseToolName('client__7__select-users')).toEqual({
      prefix: 'client',
      toolId: 7,
      toolName: 'select-users',
    });
  });

  it('keeps the rest of the name (which may contain underscores) intact', () => {
    expect(parseToolName('mcp__12__get_user_profile')).toEqual({
      prefix: 'mcp',
      toolId: 12,
      toolName: 'get_user_profile',
    });
  });

  it('returns null on an unknown prefix', () => {
    expect(parseToolName('http__1__x')).toBeNull();
  });

  it('returns null when the format does not match at all', () => {
    expect(parseToolName('not_a_tool')).toBeNull();
  });

  it('returns null when the id is non-numeric', () => {
    expect(parseToolName('mcp__abc__x')).toBeNull();
  });
});


