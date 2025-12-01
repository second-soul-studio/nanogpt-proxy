import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { EnvironmentModule, RedisModule } from '@nanogpt-monorepo/core';
import { TokenService } from './token.service';

@Module({
  imports: [EnvironmentModule, RedisModule],
  providers: [SecurityService, TokenService],
  exports: [SecurityService, TokenService],
})
export class SecurityModule {}
