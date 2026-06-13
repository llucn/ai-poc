import { describe, expect, it } from 'vitest';
import { extractJsonObject } from './extract-json';

describe('extractJsonObject', () => {
  it('returns clean JSON unchanged', () => {
    const s = '{"thought":"hi","final_answer":"done"}';
    expect(extractJsonObject(s)).toBe(s);
  });

  it('trims surrounding whitespace', () => {
    const s = '  \n {"a":1}\n  ';
    expect(extractJsonObject(s)).toBe('{"a":1}');
  });

  it('unwraps a ```json fenced block', () => {
    const raw = '```json\n{"thought":"x","final_answer":"y"}\n```';
    expect(extractJsonObject(raw)).toBe('{"thought":"x","final_answer":"y"}');
  });

  it('unwraps a bare ``` fenced block (no language tag)', () => {
    const raw = '```\n{"a":1}\n```';
    expect(extractJsonObject(raw)).toBe('{"a":1}');
  });

  it('strips leading and trailing prose around an object', () => {
    const raw = 'Here is the JSON: {"a":1} Hope that helps!';
    expect(extractJsonObject(raw)).toBe('{"a":1}');
  });

  it('does not get confused by braces inside string values', () => {
    const raw = '```json\n{"final_answer":"use {curly} braces {like this}"}\n```';
    expect(extractJsonObject(raw)).toBe(
      '{"final_answer":"use {curly} braces {like this}"}'
    );
  });

  it('handles escaped quotes inside strings', () => {
    const s = '{"final_answer":"she said \\"hi\\" and left"}';
    expect(extractJsonObject(s)).toBe(s);
  });

  it('extracts the outermost object with nested objects', () => {
    const raw = '```json\n{"action":{"tool":"t","params":{"x":1}}}\n```';
    expect(extractJsonObject(raw)).toBe(
      '{"action":{"tool":"t","params":{"x":1}}}'
    );
  });

  it('returns the trimmed input when no object is present', () => {
    expect(extractJsonObject('  no json here  ')).toBe('no json here');
  });

  it('returns from the first brace when output is truncated (unbalanced)', () => {
    // Caller's JSON.parse will then surface the parse error.
    expect(extractJsonObject('{"a":1')).toBe('{"a":1');
  });

  it('handles empty / falsy input', () => {
    expect(extractJsonObject('')).toBe('');
  });

  it('produces JSON.parse-able output for fenced LLM replies', () => {
    const raw = '```json\n{"thought":"t","action":{"tool":"get","params":{}}}\n```';
    const obj = JSON.parse(extractJsonObject(raw));
    expect(obj.action.tool).toBe('get');
  });
});
