import { Injectable, Logger } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import axios from 'axios';

export interface ServiceHealthStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

export interface AggregatedHealth {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  uptime: number;
  services: ServiceHealthStatus[];
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly proxyService: ProxyService) {}

  getBasicHealth(): { status: string; service: string; timestamp: string; uptime: number } {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime,
    };
  }

  async getAggregatedHealth(): Promise<AggregatedHealth> {
    const services = this.proxyService.getAllServices();
    const healthChecks: ServiceHealthStatus[] = [];

    for (const [name, url] of Object.entries(services)) {
      const status = await this.checkService(name, url);
      healthChecks.push(status);
    }

    const unhealthyCount = healthChecks.filter(
      (s) => s.status === 'unhealthy',
    ).length;
    const overallStatus =
      unhealthyCount === 0
        ? 'ok'
        : unhealthyCount === healthChecks.length
          ? 'down'
          : 'degraded';

    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: overallStatus as 'ok' | 'degraded' | 'down',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime,
      services: healthChecks,
    };
  }

  private async checkService(
    name: string,
    url: string,
  ): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        return {
          name,
          url,
          status: 'healthy',
          responseTime,
        };
      }

      return {
        name,
        url,
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.warn(
        `Health check failed for ${name}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        name,
        url,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
