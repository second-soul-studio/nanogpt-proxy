import { Controller, All, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import express from 'express';
import { ForwarderService } from './forwarder.service';

@Controller('/v1')
export class ForwarderController {
  constructor(private readonly forwarder: ForwarderService) {}

  @All('*')
  async proxy(@Req() req: express.Request, @Res() res: express.Response) {
    try {
      await this.forwarder.handleRequest(req, res);
    } catch (err: unknown) {
      console.error('Forwarder error:', err);

      if (err instanceof HttpException) {
        throw err;
      }

      const message = err instanceof Error ? err.message : 'Forwarding failed';

      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
