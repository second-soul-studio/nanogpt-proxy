import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const decryptMock = jest.fn();
const dbPrepareMock = jest.fn();
const nanoClientInstanceMock = {
  getModels: jest.fn(),
  proxyRequest: jest.fn(),
};
const NanoGptApiClientMock = jest.fn(() => nanoClientInstanceMock);

jest.unstable_mockModule('../../utilities/crypto.js', () => ({
  decrypt: decryptMock,
}));

jest.unstable_mockModule('../../databases/sqlite-db.js', () => ({
  db: {
    prepare: dbPrepareMock,
  },
}));

jest.unstable_mockModule('../../apis/nanogpt-api-client.js', () => ({
  NanoGptApiClient: NanoGptApiClientMock,
}));

const { default: registerProxyRoutes } = await import('../proxy.js');

describe('proxy.js routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    registerProxyRoutes(app);
  });

  test('GET /v1/models bypasses user check and returns data when success', async () => {
    nanoClientInstanceMock.getModels.mockResolvedValue({
      success: true,
      data: { models: ['m1', 'm2'] },
      headers: { 'content-type': 'application/json' },
    });

    const res = await request(app).get('/v1/models');

    expect(NanoGptApiClientMock).toHaveBeenCalledTimes(1);
    expect(nanoClientInstanceMock.getModels).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ models: ['m1', 'm2'] });
  });

  test('GET /v1/models returns error when NanoGPT API fails', async () => {
    nanoClientInstanceMock.getModels.mockResolvedValue({
      success: false,
      error: 'upstream boom',
      status: 503,
    });

    const res = await request(app).get('/v1/models');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'upstream boom' });
  });

  test('returns 400 when x-openwebui-user-email header is missing', async () => {
    const res = await request(app)
      .post('/v1/chat/completions')
      .send({ foo: 'bar' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: '⚠️ Missing user email header' });
    expect(dbPrepareMock).not.toHaveBeenCalled();
    expect(NanoGptApiClientMock).not.toHaveBeenCalled();
  });

  test('returns 401 when user is not found in DB', async () => {
    dbPrepareMock.mockReturnValue({
      get: () => undefined,
    });

    const res = await request(app)
      .post('/v1/chat/completions')
      .set('x-openwebui-user-email', 'user@example.com')
      .send({ foo: 'bar' });

    expect(dbPrepareMock).toHaveBeenCalledWith(
      'SELECT api_key FROM users WHERE email = ?'
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: '⚠️ User not found in DB' });
    expect(decryptMock).not.toHaveBeenCalled();
    expect(NanoGptApiClientMock).not.toHaveBeenCalled();
  });

  test('proxies request when user exists and upstream succeeds', async () => {
    dbPrepareMock.mockReturnValue({
      get: () => ({ api_key: 'encrypted-key' }),
    });

    decryptMock.mockReturnValue('decrypted-key');

    const pipeMock = jest.fn(res => res.end());

    nanoClientInstanceMock.proxyRequest.mockResolvedValue({
      success: true,
      headers: { 'content-type': 'application/json' },
      data: { pipe: pipeMock },
    });

    const res = await request(app)
      .post('/v1/chat/completions')
      .set('x-openwebui-user-email', 'user@example.com')
      .send({ foo: 'bar' });

    expect(dbPrepareMock).toHaveBeenCalled();
    expect(decryptMock).toHaveBeenCalledWith('encrypted-key');
    expect(NanoGptApiClientMock).toHaveBeenCalledWith('decrypted-key');
    expect(nanoClientInstanceMock.proxyRequest).toHaveBeenCalled();

    expect(pipeMock).toHaveBeenCalled();

    expect(res.status).toBe(200);
  });

  test('returns upstream error when proxyRequest fails', async () => {
    dbPrepareMock.mockReturnValue({
      get: () => ({ api_key: 'encrypted-key' }),
    });
    decryptMock.mockReturnValue('decrypted-key');

    nanoClientInstanceMock.proxyRequest.mockResolvedValue({
      success: false,
      status: 502,
      error: 'bad gateway',
    });

    const res = await request(app)
      .post('/v1/chat/completions')
      .set('x-openwebui-user-email', 'user@example.com')
      .send({ foo: 'bar' });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'bad gateway' });
  });
});
