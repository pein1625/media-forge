import { Injectable, BadGatewayException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Request } from 'express';
import { ServicesConfig } from '../config/services.config';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly servicesMap: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      timeout: 30000,
    });

    const servicesConfig = this.configService.get<ServicesConfig>('services')!;
    this.servicesMap = {
      'user-service': servicesConfig.userService,
      'upload-service': servicesConfig.uploadService,
      'catalog-service': servicesConfig.catalogService,
      'transcode-service': servicesConfig.transcodeService,
      'ai-service': servicesConfig.aiService,
      'streaming-service': servicesConfig.streamingService,
      'notification-service': servicesConfig.notificationService,
    };
  }

  async forward(
    serviceName: string,
    req: Request,
    path: string,
  ): Promise<{ data: any; status: number; headers: Record<string, any> }> {
    const serviceUrl = this.servicesMap[serviceName];

    if (!serviceUrl) {
      this.logger.error(`Unknown service: ${serviceName}`);
      throw new BadGatewayException(`Unknown service: ${serviceName}`);
    }

    const targetUrl = `${serviceUrl}${path}`;
    const method = req.method.toLowerCase();

    const headers = this.prepareHeaders(req);

    try {
      this.logger.debug(`Forwarding ${method.toUpperCase()} ${targetUrl}`);

      const response = await this.axiosInstance({
        method,
        url: targetUrl,
        headers,
        data: req.body || undefined,
        params: req.query,
        validateStatus: () => true,
      });

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      this.logger.error(
        `Error forwarding request to ${serviceName}: ${error instanceof AxiosError ? error.message : String(error)}`,
      );

      if (error instanceof AxiosError && error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException(
          `Service ${serviceName} is unavailable`,
        );
      }

      throw new BadGatewayException(
        `Error communicating with ${serviceName}`,
      );
    }
  }

  private prepareHeaders(req: Request): Record<string, string | string[]> {
    const headers: Record<string, string | string[]> = {};

    for (const [key, value] of Object.entries(req.headers)) {
      if (
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'connection' &&
        key.toLowerCase() !== 'content-length'
      ) {
        headers[key] = value as string | string[];
      }
    }

    return headers;
  }

  getServiceUrl(serviceName: string): string | undefined {
    return this.servicesMap[serviceName];
  }

  getAllServices(): Record<string, string> {
    return { ...this.servicesMap };
  }
}
