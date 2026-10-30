import { describe, it, expect } from 'vitest';
import { SERVICES, getServiceCredentialKeys, isServiceConfigured } from './services';

describe('isServiceConfigured', () => {
  it('treats Custom with a base URL and no key as configured (Ollama, LM Studio)', () => {
    expect(isServiceConfigured(SERVICES.custom, {
      customApiKey: '',
      customBaseUrl: 'http://127.0.0.1:11434/v1',
    })).toBe(true);
  });

  it('treats Custom without a base URL as not configured', () => {
    expect(isServiceConfigured(SERVICES.custom, { customApiKey: 'sk-something' })).toBe(false);
  });

  it('still requires a key for cloud providers', () => {
    expect(isServiceConfigured(SERVICES.openai, { openaiApiKey: '' })).toBe(false);
    expect(isServiceConfigured(SERVICES.openai, { openaiApiKey: 'sk-1234567890abcdefghij' })).toBe(true);
  });

  it('reads the base URL key only for providers that have one', () => {
    expect(getServiceCredentialKeys(SERVICES.custom)).toEqual(['customApiKey', 'customBaseUrl']);
    expect(getServiceCredentialKeys(SERVICES.google)).toEqual(['geminiApiKey']);
  });
});
