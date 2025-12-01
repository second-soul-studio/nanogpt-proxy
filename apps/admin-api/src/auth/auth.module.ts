import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  CryptoModule,
  EnvironmentModule,
  RedisModule,
  UserRepository,
} from '@nanogpt-monorepo/core';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [EnvironmentModule, CryptoModule, RedisModule, SecurityModule],
  providers: [AuthService, UserRepository],
  controllers: [AuthController],
})
export class AuthModule {}
