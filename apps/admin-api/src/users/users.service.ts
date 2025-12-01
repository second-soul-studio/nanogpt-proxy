import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { CryptorService, EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { DeleteUserDto } from '../dtos/delete-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { SecurityService } from '../security/security.service';
import { maskEmail } from '@nanogpt-monorepo/core/dist/utilities/masking.utils';
import { toNewUserEntity, toUpdatedUserEntity } from '../mappers/user.mapper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly cryptorService: CryptorService,
    private readonly environment: EnvironmentService,
    private readonly users: UserRepository,
    private readonly security: SecurityService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (exists) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await this.security.hashPassword(dto.password);
    const apiKeyEncrypted = this.cryptorService.encrypt(dto.api_key);

    const user = toNewUserEntity(dto, {
      passwordHash,
      apiKeyEncrypted,
    });

    await this.users.saveUser(user);
    this.logger.log(`New user created: ${maskEmail(dto.email)}`);
  }

  async deleteUser(dto: DeleteUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (!exists) {
      throw new BadRequestException(`Can't remove user`);
    }

    if (this.isAdmin(exists, dto.email)) {
      throw new BadRequestException(`Can't remove user`);
    }

    await this.users.deleteUser(dto.email);
    this.logger.log(`Deleted user: ${maskEmail(dto.email)}`);
  }

  async updateUser(dto: UpdateUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (!exists) {
      throw new BadRequestException("Can't update user");
    }

    if (this.isAdmin(exists, dto.email) && dto.role !== 'ADMIN') {
      throw new BadRequestException(`Can't downgrade user role`);
    }

    const passwordHash = dto.password ? await this.security.hashPassword(dto.password) : undefined;
    const apiKeyEncrypted = dto.api_key ? this.cryptorService.encrypt(dto.api_key) : undefined;

    const user = toUpdatedUserEntity(dto, exists, {
      passwordHash,
      apiKeyEncrypted,
    });

    await this.users.saveUser(user);
    this.logger.log(`Updated user: ${maskEmail(dto.email)}`);
  }

  async upsertKey(dto: UpdateUserDto): Promise<void> {
    const exists = await this.users.getUser(dto.email);
    if (!exists) {
      throw new BadRequestException(`Can't update api key`);
    }

    if (!dto.api_key) {
      throw new BadRequestException(`Can't update api key`);
    }

    await this.users.upsertApiKey(dto.email, dto.api_key);
    this.logger.log(`Upsert apikey for user: ${maskEmail(dto.email)}`);
  }

  async getAll(): Promise<Omit<UserEntity, 'password'>[]> {
    return this.users.getAllUsers();
  }

  private isAdmin(userEntity: UserEntity, email: string): boolean {
    return userEntity.role === 'ADMIN' && this.environment.adminEmail === email;
  }
}
