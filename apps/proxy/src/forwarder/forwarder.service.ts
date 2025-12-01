import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { CryptorService, EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';

type OpenWebUiRequestBody = Record<string, unknown>;

@Injectable()
export class ForwarderService {
  private readonly API_BASE = 'https://nano-gpt.com/api' as const;
  private readonly SUBSCRIPTION_API = `${this.API_BASE}/subscription/v1` as const;
  private readonly REGULAR_API = `${this.API_BASE}/v1` as const;

  constructor(
    private readonly env: EnvironmentService,
    private readonly cryptor: CryptorService,
    private readonly users: UserRepository,
  ) {}

  async handleRequest(
    req: Request & { body?: OpenWebUiRequestBody },
    res: Response,
  ): Promise<void> {
    const userEmail = req.headers['x-openwebui-user-email'] as string | undefined;

    console.log(`[${req.method}] ${req.path} for ${userEmail || 'unknown user'}`);

    if (req.path === '/v1/models') {
      await this.forwardModels(res);
      return;
    }

    if (!userEmail) {
      throw new HttpException('Missing user email header', HttpStatus.BAD_REQUEST);
    }

    const entry = await this.users.getUser(userEmail);

    if (!entry) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const decryptedKey = this.cryptor.decrypt(entry.api_key);

    await this.forwardGeneric(req, res, decryptedKey);
  }

  private async forwardModels(res: Response): Promise<void> {
    try {
      const r: AxiosResponse<unknown> = await axios.get(`${this.SUBSCRIPTION_API}/models`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
      });

      res.json(r.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<unknown>;
        const status = axiosErr.response?.status ?? HttpStatus.BAD_GATEWAY;
        const data = axiosErr.response?.data ?? { message: 'Error fetching models from upstream' };

        console.error('Error fetching models:', data);
        throw new HttpException(data as Record<string, unknown>, status);
      }

      console.error('Unknown error fetching models:', error);
      throw new HttpException({ error: 'Unknown upstream error' }, HttpStatus.BAD_GATEWAY);
    }
  }

  private async forwardGeneric(req: Request, res: Response, apiKey: string): Promise<void> {
    const upstream: AxiosResponse<Readable> = await axios.request<unknown, AxiosResponse<Readable>>(
      {
        url: `${this.REGULAR_API}${req.path}`,
        method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: req.method !== 'GET' ? req.body : undefined,
        responseType: 'stream',
        timeout: 180_000,
      },
    );

    const contentType =
      (upstream.headers['content-type'] as string | undefined) ?? 'application/json';

    res.setHeader('Content-Type', contentType);

    upstream.data.pipe(res);
  }
}
