import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  // Gateway: /api/v1/auth/* → User Service: /api/v1/auth/*
  @All('/auth/*')
  async authProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.proxyRequest(res, 'user-service', req.path, req);
  }

  // Gateway: /api/v1/users/* → User Service: /api/v1/users/*
  @All('/users/*')
  @UseGuards(JwtAuthGuard)
  async usersProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.attachUserHeaders(req);
    await this.proxyRequest(res, 'user-service', req.path, req);
  }

  // Gateway: /api/v1/upload/* → Upload Service: /api/v1/upload/*
  @All('/upload/*')
  @UseGuards(JwtAuthGuard)
  async uploadProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.attachUserHeaders(req);
    await this.proxyRequest(res, 'upload-service', req.path, req);
  }

  // Gateway: /api/v1/media/* → Catalog Service: /api/v1/media/*
  @All('/media/*')
  @UseGuards(OptionalAuthGuard)
  async mediaProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    if (req.user) {
      this.attachUserHeaders(req);
    }

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      req.method,
    );
    if (isMutation && !req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await this.proxyRequest(res, 'catalog-service', req.path, req);
  }

  // Gateway: /api/v1/stream/* → Streaming Service: /api/v1/stream/*
  @All('/stream/*')
  @UseGuards(OptionalAuthGuard)
  async streamProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    if (req.user) {
      this.attachUserHeaders(req);
    }
    await this.proxyRequest(res, 'streaming-service', req.path, req);
  }

  // Gateway: /api/v1/transcode/* → Transcode Service: /api/v1/transcode/*
  @All('/transcode/*')
  @UseGuards(JwtAuthGuard)
  async transcodeProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.attachUserHeaders(req);
    await this.proxyRequest(res, 'transcode-service', req.path, req);
  }

  // Gateway: /api/v1/ai/* → AI Service: /api/v1/ai/*
  @All('/ai/*')
  @UseGuards(JwtAuthGuard)
  async aiProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.attachUserHeaders(req);
    await this.proxyRequest(res, 'ai-service', req.path, req);
  }

  // Gateway: /api/v1/notifications/* → Notification Service: /api/v1/notifications/*
  @All('/notifications/*')
  @UseGuards(JwtAuthGuard)
  async notificationsProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.attachUserHeaders(req);
    await this.proxyRequest(res, 'notification-service', req.path, req);
  }

  private async proxyRequest(
    res: Response,
    serviceName: string,
    path: string,
    req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      const result = await this.proxyService.forward(
        serviceName,
        req,
        path,
      );

      res.status(result.status);

      for (const [key, value] of Object.entries(result.headers)) {
        if (
          key.toLowerCase() !== 'content-encoding' &&
          key.toLowerCase() !== 'transfer-encoding'
        ) {
          res.setHeader(key, value);
        }
      }

      res.send(result.data);
    } catch (error) {
      this.logger.error(
        `Proxy error in ${serviceName}: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (res.headersSent) {
        return;
      }

      if (error instanceof BadRequestException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.getResponse(),
        });
        return;
      }

      res.status(503).json({
        statusCode: 503,
        message: 'Service Unavailable',
      });
    }
  }

  private attachUserHeaders(req: AuthenticatedRequest): void {
    if (req.user) {
      req.headers['x-user-id'] = req.user.userId;
      req.headers['x-user-email'] = req.user.email;
      req.headers['x-user-role'] = req.user.role;
    }
  }
}
