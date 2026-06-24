import { describe, it, expect } from 'vitest';
import { buildLoadingMessage, getNextLoadingMessageIndex } from './loadingMessages';
import { LOADING_MESSAGE_TEMPLATES } from '../config/loadingMessages';

const countTemplateIndex = LOADING_MESSAGE_TEMPLATES.findIndex(template =>
  template.includes('{bookmarks}')
);

describe('buildLoadingMessage', () => {
  it('substitutes a formatted, pluralized bookmark count', () => {
    const message = buildLoadingMessage(countTemplateIndex, 1240);
    expect(message).toContain('1,240 bookmarks');
    expect(message).not.toContain('{bookmarks}');
  });

  it('uses the singular form for one bookmark', () => {
    const message = buildLoadingMessage(countTemplateIndex, 1);
    expect(message).toContain('1 bookmark');
    expect(message).not.toContain('1 bookmarks');
  });

  it('wraps an out-of-range index instead of throwing', () => {
    expect(() => buildLoadingMessage(999, 5)).not.toThrow();
  });
});

describe('getNextLoadingMessageIndex', () => {
  it('wraps back to zero at the end', () => {
    expect(getNextLoadingMessageIndex(LOADING_MESSAGE_TEMPLATES.length - 1)).toBe(0);
  });

  it('advances by one otherwise', () => {
    expect(getNextLoadingMessageIndex(0)).toBe(1);
  });
});
