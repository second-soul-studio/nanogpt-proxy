import { Body, Controller, Get, Logger, Post, Put, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationTypes } from './configuration.types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('v1/configuration')
export class ConfigurationController {
  private readonly logger = new Logger(ConfigurationController.name);

  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  async getConfig(): Promise<ConfigurationTypes> {
    return this.configurationService.getConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put()
  async updateConfig(@Body() body: Partial<ConfigurationTypes>): Promise<ConfigurationTypes> {
    this.logger.debug(`RAW BODY: ${JSON.stringify(body)}`);
    return this.configurationService.updateConfig(body);
  }
}
