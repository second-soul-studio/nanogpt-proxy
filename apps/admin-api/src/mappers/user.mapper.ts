import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export function toNewUserEntity(
  dto: CreateUserDto,
  deps: {
    passwordHash: string;
    apiKeyEncrypted: string;
    defaultRole?: string;
  },
): UserEntity {
  return {
    enabled: true,
    email: dto.email.trim().toLowerCase(),
    password: deps.passwordHash,
    api_key: deps.apiKeyEncrypted,
    role: deps.defaultRole ?? 'USER',
  };
}

export function toUpdatedUserEntity(
  dto: UpdateUserDto,
  existing: UserEntity,
  deps: {
    passwordHash?: string;
    apiKeyEncrypted?: string;
  },
): UserEntity {
  return {
    ...existing,
    email: dto.email ?? existing.email,
    password: deps.passwordHash ?? existing.password,
    api_key: deps.apiKeyEncrypted ?? existing.api_key,
    role: dto.role ?? existing.role,
    enabled: dto.enabled ?? existing.enabled,
  };
}
