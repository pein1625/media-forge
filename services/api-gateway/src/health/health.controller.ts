import { Controller, Get } from '@nestjs/common';
import { HealthService, AggregatedHealth } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): { status: string; service: string; timestamp: string; uptime: number } {
    return this.healthService.getBasicHealth();
  }

  @Get('services')
  async getServicesHealth(): Promise<AggregatedHealth> {
    return this.healthService.getAggregatedHealth();
  }
}
