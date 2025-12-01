import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentService } from '@nanogpt-monorepo/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const environmentService = app.get(EnvironmentService);

  await app.listen(environmentService.proxyPort);
}

void bootstrap();
