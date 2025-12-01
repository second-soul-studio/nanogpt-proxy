import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { SecurityService } from '../security/security.service';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { LoginDto } from '../dtos/login.dto';
import { TokenService } from '../security/token.service';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly security: SecurityService,
    private readonly tokens: TokenService,
    private readonly env: EnvironmentService,
  ) {}

  private async ensureBootstrapAdmin(): Promise<void> {
    const email = this.env.adminEmail;
    const password = this.env.adminPassword;

    if (!email || !password) {
      this.logger.warn(
        "ADMIN_EMAIL / ADMIN_PASSWORD not configured – admin bootstrap won't be created.",
      );
      return;
    }

    const existing = await this.users.getUser(email);
    if (existing && existing.role === 'ADMIN') {
      return;
    }

    const passwordHash = await this.security.hashPassword(password);

    const adminUser: UserEntity = {
      enabled: true,
      email,
      password: passwordHash,
      api_key: '',
      role: 'ADMIN',
    };

    await this.users.saveUser(adminUser);

    this.logger.log(`Admin bootstrap created for ${email}`);
  }

  async login(dto: LoginDto) {
    await this.ensureBootstrapAdmin();

    const user = await this.users.getUser(dto.email);

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.security.verifyPassword(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.tokens.rotateTokens(user);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      email: user.email,
      role: user.role,
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokens.verifyRefreshToken(refreshToken);
    const user = await this.users.getUser(payload.sub);

    if (!user || !user.enabled) {
      throw new UnauthorizedException('User not found or disabled');
    }

    return await this.tokens.rotateTokens(user);
  }

  async logout(accessToken: string) {
    const decoded = jwt.decode(accessToken) as {
      sub?: string;
      jti?: string;
      exp?: number;
    } | null;

    if (!decoded?.sub || !decoded?.jti) {
      return;
    }

    await this.tokens.blacklistAccessToken(decoded.jti, decoded.exp);
    await this.tokens.revokeRefreshForUser(decoded.sub);
  }
}
