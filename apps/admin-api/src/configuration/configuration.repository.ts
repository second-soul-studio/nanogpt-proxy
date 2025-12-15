import { Injectable } from '@nestjs/common';
import { RedisService } from '@nanogpt-monorepo/core';
import { ConfigurationTypes, DEFAULT_NANOGPT_CONFIG } from './configuration.types';

const CONFIG_PREFIX = 'config:nanogpt';
const FEATURES_KEY = `${CONFIG_PREFIX}:features`;

@Injectable()
export class ConfigurationRepository {
  constructor(private readonly redis: RedisService) {}

  private parseBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value == null) return fallback;

    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private toHash(config: ConfigurationTypes): Record<string, string> {
    return {
      enableForgetPassword: String(config.enableForgetPassword),
      enableRegistration: String(config.enableRegistration),
      enableReviewPendingRegistration: String(config.enableReviewPendingRegistration),
    };
  }

  private fromHash(data: Record<string, string> | null): ConfigurationTypes {
    if (!data) {
      return { ...DEFAULT_NANOGPT_CONFIG };
    }

    return {
      enableForgetPassword: this.parseBoolean(
        data.enableForgetPassword,
        DEFAULT_NANOGPT_CONFIG.enableForgetPassword,
      ),
      enableRegistration: this.parseBoolean(
        data.enableRegistration,
        DEFAULT_NANOGPT_CONFIG.enableRegistration,
      ),
      enableReviewPendingRegistration: this.parseBoolean(
        data.enableReviewPendingRegistration,
        DEFAULT_NANOGPT_CONFIG.enableReviewPendingRegistration,
      ),
    };
  }

  async getConfig(): Promise<ConfigurationTypes> {
    const data = await this.redis.getHash(FEATURES_KEY);
    return this.fromHash(data);
  }

  async saveConfig(partialConfig: Partial<ConfigurationTypes>): Promise<ConfigurationTypes> {
    const current = await this.getConfig();

    const next: ConfigurationTypes = {
      ...current,
      ...partialConfig,
    };

    await this.redis.setHash(FEATURES_KEY, this.toHash(next));
    return next;
  }
}
