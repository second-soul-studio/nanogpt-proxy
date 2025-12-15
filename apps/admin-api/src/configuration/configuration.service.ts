import { Injectable } from '@nestjs/common';
import { ConfigurationRepository } from './configuration.repository';
import { ConfigurationTypes } from './configuration.types';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configuration: ConfigurationRepository) {}

  async getConfig() {
    return this.configuration.getConfig();
  }

  async updateConfig(partial: Partial<ConfigurationTypes>) {
    return this.configuration.saveConfig(partial);
  }
}
