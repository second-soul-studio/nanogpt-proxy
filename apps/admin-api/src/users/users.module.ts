import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CryptoModule,
  EnvironmentModule,
  RedisModule,
  UserRepository,
} from '@nanogpt-monorepo/core';
import { UsersController } from './users.controller';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [EnvironmentModule, CryptoModule, RedisModule, SecurityModule],
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
})
export class UsersModule {}
