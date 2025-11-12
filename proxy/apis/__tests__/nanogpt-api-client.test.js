import { jest } from '@jest/globals';
import modelsMock from '../../__mocks__/v1-models.json' with { type: 'json' };
import chatResponseMock from '../../__mocks__/v1-chat-completions.json' with { type: 'json' };

jest.unstable_mockModule('axios', () => {
  const create = jest.fn(() => ({
    get: jest.fn(),
    request: jest.fn(),
  }));
  return { default: { create } };
});

const { default: axios } = await import('axios');
const { NanoGptApiClient } = await import('../nanogpt-api-client.js');

describe('nanogpt-api-client.js', () => {
  const apiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructor should pass baseURL, timeout and Authorization header to axios.create', () => {
    const client = new NanoGptApiClient(apiKey); // eslint-disable-line no-unused-vars

    expect(axios.create).toHaveBeenCalledTimes(1);
    const cfg = axios.create.mock.calls[0][0];
    expect(cfg.baseURL).toBe('https://nano-gpt.com/api/v1');
    expect(cfg.timeout).toBe(10000);
    expect(cfg.headers['Content-Type']).toBe('application/json');
    expect(cfg.headers['Authorization']).toBe(`Bearer ${apiKey}`);
  });

  it('getModels should return model list (success path)', async () => {
    const instance = {
      get: jest.fn().mockResolvedValue({ data: modelsMock, headers: { 'x-test': 'ok' } }),
    };
    axios.create.mockReturnValueOnce(instance);

    const client = new NanoGptApiClient(apiKey);
    const res = await client.getModels();

    expect(instance.get).toHaveBeenCalledWith('/models');
    expect(res.success).toBe(true);
    expect(res.data).toEqual(modelsMock);
    expect(res.headers).toEqual({ 'x-test': 'ok' });
  });

  it('proxyRequest should forward a POST with body and return headers', async () => {
    const instance = {
      request: jest.fn().mockResolvedValue({
        data: chatResponseMock,
        headers: { 'content-type': 'application/json' },
      }),
    };
    axios.create.mockReturnValueOnce(instance);

    const client = new NanoGptApiClient(apiKey);
    const req = {
      path: '/v1/chat/completions',
      method: 'POST',
      body: { messages: [{ role: 'user', content: 'Hello' }] },
    };

    const res = await client.proxyRequest(req);

    expect(instance.request).toHaveBeenCalledWith({
      url: '/chat/completions',
      method: 'POST',
      data: req.body,
      responseType: 'stream',
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(chatResponseMock);
    expect(res.headers).toEqual({ 'content-type': 'application/json' });
  });

  it('proxyRequest should forward a GET without data and strip /v1 prefix', async () => {
    const instance = {
      request: jest.fn().mockResolvedValue({ data: { ok: true }, headers: {} }),
    };
    axios.create.mockReturnValueOnce(instance);

    const client = new NanoGptApiClient(apiKey);
    const req = {
      path: '/v1/some/resource',
      method: 'GET',
      body: { shouldNotBeSent: true },
    };

    const res = await client.proxyRequest(req);

    expect(instance.request).toHaveBeenCalledWith({
      url: '/some/resource',
      method: 'GET',
      data: undefined,
      responseType: 'stream',
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ ok: true });
  });

  it('safe() should map axios error with response (status + data)', async () => {
    const instance = {
      get: jest.fn().mockRejectedValue({
        response: { status: 404, data: { error: 'Not found' } },
      }),
    };
    axios.create.mockReturnValueOnce(instance);

    const client = new NanoGptApiClient(apiKey);
    const res = await client.getModels();

    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
    expect(res.error).toEqual({ error: 'Not found' });
  });

  it('safe() should map axios error without response (generic/network)', async () => {
    const instance = {
      get: jest.fn().mockRejectedValue(new Error('boom')),
    };
    axios.create.mockReturnValueOnce(instance);

    const client = new NanoGptApiClient(apiKey);
    const res = await client.getModels();

    expect(res.success).toBe(false);
    expect(res.status).toBe(500);
    expect(String(res.error)).toMatch(/boom/);
  });
});
