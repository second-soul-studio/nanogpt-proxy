// apps/admin-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentService } from '@nanogpt-monorepo/core';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const environmentService = app.get(EnvironmentService);

  await app.listen(environmentService.proxyPort);
}

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
