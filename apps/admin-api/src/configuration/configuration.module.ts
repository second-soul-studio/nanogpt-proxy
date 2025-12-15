import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { RedisModule } from '@nanogpt-monorepo/core';
import { ConfigurationRepository } from './configuration.repository';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [RedisModule, SecurityModule],
  providers: [ConfigurationService, ConfigurationRepository],
  controllers: [ConfigurationController],
})
export class ConfigurationModule {}
