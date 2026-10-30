import { describe, it, expect, vi, afterEach } from 'vitest';
import { callCustom, CUSTOM_FORBIDDEN_MESSAGE } from './custom';

const BASE_URL = 'http://127.0.0.1:11434/v1';

const chatReply = (content: string): Response =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }), { status: 200 });

const sentBodies = (fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown>[] =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe('callCustom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for JSON mode when the caller expects JSON', async () => {
    const fetchMock = vi.fn(async () => chatReply('{"folders":[]}'));
    vi.stubGlobal('fetch', fetchMock);

    await callCustom('', BASE_URL, 'system', 'user', 'qwen2.5:3b', undefined, 15, true);

    expect(sentBodies(fetchMock)[0].response_format).toEqual({ type: 'json_object' });
  });

  it('leaves single-page requests as plain text', async () => {
    const fetchMock = vi.fn(async () => chatReply('Recipes'));
    vi.stubGlobal('fetch', fetchMock);

    await callCustom('', BASE_URL, 'system', 'user', 'qwen2.5:3b');

    expect(sentBodies(fetchMock)[0]).not.toHaveProperty('response_format');
  });

  it('retries without JSON mode when the server rejects it', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{"error":"response_format not supported"}', { status: 400 }))
      .mockResolvedValueOnce(chatReply('{"folders":[]}'));
    vi.stubGlobal('fetch', fetchMock);

    const text = await callCustom('', BASE_URL, 'system', 'user', 'local-model', undefined, 15, true);

    expect(text).toBe('{"folders":[]}');
    expect(sentBodies(fetchMock)[1]).not.toHaveProperty('response_format');
  });

  it('explains how to allow the extension when the server answers 403', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(callCustom('', BASE_URL, 'system', 'user', 'qwen2.5:3b'))
      .rejects.toThrow(CUSTOM_FORBIDDEN_MESSAGE);
  });
});

describe('callCustom cancellation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('aborts the in-flight request when the run is cancelled', async () => {
    let fetchSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      fetchSignal = init.signal ?? undefined;
      fetchSignal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const controller = new AbortController();

    const request = callCustom('', BASE_URL, 'system', 'user', 'qwen2.5:3b', undefined, 15, true, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSignal?.aborted).toBe(true);
  });
});
