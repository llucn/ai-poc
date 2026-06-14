import { describe, expect, it } from 'vitest';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { countToolUseRounds, parseToolName } from './session.service';

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

describe('countToolUseRounds', () => {
  it('counts assistant turns that contain a tool_use block', () => {
    const messages: MessageParam[] = [
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'thinking' },
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'mcp__1__x',
            input: {},
          },
        ],
      },
      {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'toolu_1', content: '1' },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_2',
            name: 'mcp__1__x',
            input: {},
          },
        ],
      },
    ];
    expect(countToolUseRounds(messages)).toBe(2);
  });

  it('does not count assistant text turns', () => {
    const messages: MessageParam[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    expect(countToolUseRounds(messages)).toBe(0);
  });

  it('does not count user tool_result turns', () => {
    const messages: MessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'toolu_1', content: 'x' },
        ],
      },
    ];
    expect(countToolUseRounds(messages)).toBe(0);
  });

  it('counts the suspended (yet-unanswered) tool_use', () => {
    // The pending row's saved context ends with the assistant turn carrying
    // the tool_use that is awaiting the browser. That round must be counted
    // so the cap is consistent with the in-process loop.
    const messages: MessageParam[] = [
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_pending',
            name: 'client__1__select-users',
            input: {},
          },
        ],
      },
    ];
    expect(countToolUseRounds(messages)).toBe(1);
  });
});
