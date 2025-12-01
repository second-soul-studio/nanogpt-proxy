// apps/admin-api/src/main.spec.ts
import { NestFactory } from '@nestjs/core';
import { EnvironmentService } from '@nanogpt-monorepo/core';
import { AppModule } from './app.module';
import { bootstrap } from './main';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('bootstrap', () => {
  it('should create the app, resolve EnvironmentService and listen on proxyPort', async () => {
    const listenMock = jest.fn();
    const getMock = jest.fn();

    (NestFactory.create as jest.Mock).mockResolvedValue({
      get: getMock,
      listen: listenMock,
    });

    const envServiceMock = {
      proxyPort: 4242,
    } as unknown as EnvironmentService;

    getMock.mockReturnValue(envServiceMock);

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(getMock).toHaveBeenCalledWith(EnvironmentService);
    expect(listenMock).toHaveBeenCalledWith(envServiceMock.proxyPort);
  });
});
