import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import * as healthOptions from './health.options';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    @Inject(healthOptions.HEALTH_MODULE_OPTIONS)
    private readonly options: healthOptions.HealthModuleOptions,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const result = await this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
    return {
      ...result,
      service: this.options.serviceName,
    };
  }
}
