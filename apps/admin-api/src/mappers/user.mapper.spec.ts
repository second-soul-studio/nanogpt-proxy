import { toNewUserEntity, toUpdatedUserEntity } from './user.mapper';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';

describe('user.mapper', () => {
  describe('toNewUserEntity', () => {
    it('should map CreateUserDto to UserEntity with default USER role when no defaultRole is provided', () => {
      const dto: CreateUserDto = {
        email: '  Admin@Example.com  ',
        password: 'plain-password',
        api_key: 'plain-api-key',
      };

      const result = toNewUserEntity(dto, {
        passwordHash: 'hashed-password',
        apiKeyEncrypted: 'encrypted-api-key',
      });

      const expected: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed-password',
        api_key: 'encrypted-api-key',
        role: 'USER',
      };

      expect(result).toEqual(expected);
    });

    it('should map CreateUserDto to UserEntity using provided defaultRole', () => {
      const dto: CreateUserDto = {
        email: 'user@example.com',
        password: 'plain-password',
        api_key: 'plain-api-key',
      };

      const result = toNewUserEntity(dto, {
        passwordHash: 'hashed-password',
        apiKeyEncrypted: 'encrypted-api-key',
        defaultRole: 'ADMIN',
      });

      expect(result.role).toBe('ADMIN');
      expect(result.enabled).toBe(true);
      expect(result.password).toBe('hashed-password');
      expect(result.api_key).toBe('encrypted-api-key');
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('toUpdatedUserEntity', () => {
    const existing: UserEntity = {
      enabled: true,
      email: 'existing@example.com',
      password: 'existing-hash',
      api_key: 'existing-api-key',
      role: 'USER',
    };

    it('should override fields from dto and deps when provided', () => {
      const dto: UpdateUserDto = {
        email: 'updated@example.com',
        password: 'new-plain-password',
        api_key: 'new-plain-api-key',
        role: 'ADMIN',
        enabled: false,
      };

      const result = toUpdatedUserEntity(dto, existing, {
        passwordHash: 'new-hashed-password',
        apiKeyEncrypted: 'new-encrypted-api-key',
      });

      expect(result.email).toBe('updated@example.com');
      expect(result.password).toBe('new-hashed-password');
      expect(result.api_key).toBe('new-encrypted-api-key');
      expect(result.role).toBe('ADMIN');
      expect(result.enabled).toBe(false);
    });

    it('should keep existing values when dto and deps do not provide overrides', () => {
      const dto: UpdateUserDto = {
        email: 'existing@example.com',
        password: undefined,
        api_key: undefined,
        role: undefined,
        enabled: undefined,
      };

      const result = toUpdatedUserEntity(dto, existing, {
        passwordHash: undefined,
        apiKeyEncrypted: undefined,
      });

      expect(result).toEqual(existing);
    });

    it('should support partial updates (e.g. only role and enabled)', () => {
      const dto: UpdateUserDto = {
        email: 'existing@example.com',
        password: '',
        api_key: '',
        role: 'ADMIN',
        enabled: false,
      };

      const result = toUpdatedUserEntity(dto, existing, {
        passwordHash: undefined,
        apiKeyEncrypted: undefined,
      });

      expect(result.email).toBe(existing.email);
      expect(result.password).toBe(existing.password);
      expect(result.api_key).toBe(existing.api_key);
      expect(result.role).toBe('ADMIN');
      expect(result.enabled).toBe(false);
    });
  });
});
