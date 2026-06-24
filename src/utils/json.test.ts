import { describe, it, expect } from 'vitest';
import { escapeControlCharsInJsonStrings, parseJsonLoose } from './json';

describe('escapeControlCharsInJsonStrings', () => {
  it('escapes literal newlines inside string values (the real bug)', () => {
    const bad = '{"summary": "line one\nline two"}';
    const fixed = escapeControlCharsInJsonStrings(bad);
    expect(() => JSON.parse(fixed)).not.toThrow();
    expect(JSON.parse(fixed).summary).toBe('line one\nline two');
  });

  it('escapes tabs and carriage returns inside strings', () => {
    const bad = '{"a": "x\ty\rz"}';
    expect(JSON.parse(escapeControlCharsInJsonStrings(bad)).a).toBe('x\ty\rz');
  });

  it('leaves structural whitespace between tokens untouched', () => {
    const ok = '{\n  "a": 1\n}';
    expect(JSON.parse(escapeControlCharsInJsonStrings(ok))).toEqual({ a: 1 });
  });

  it('does not double-escape already-escaped sequences', () => {
    const ok = '{"a": "line\\nbreak"}';
    expect(JSON.parse(escapeControlCharsInJsonStrings(ok)).a).toBe('line\nbreak');
  });

  it('handles escaped quotes inside a string', () => {
    const ok = '{"a": "she said \\"hi\\""}';
    expect(JSON.parse(escapeControlCharsInJsonStrings(ok)).a).toBe('she said "hi"');
  });

  it('escapes a control char that directly follows a backslash', () => {
    // Backslash immediately followed by a literal newline (0x0A).
    const bad = '{"a": "path\\\nmore"}';
    const fixed = escapeControlCharsInJsonStrings(bad);
    expect(() => JSON.parse(fixed)).not.toThrow();
  });
});

describe('parseJsonLoose', () => {
  it('parses valid JSON normally', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });

  it('recovers JSON with literal newlines in string values', () => {
    const bad = '{"summary": "a\nb", "n": 2}';
    expect(parseJsonLoose(bad)).toEqual({ summary: 'a\nb', n: 2 });
  });

  it('throws on truly invalid JSON', () => {
    expect(() => parseJsonLoose('{not json')).toThrow();
  });
});
