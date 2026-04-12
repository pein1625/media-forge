import { registerAs } from '@nestjs/config';

export interface ServicesConfig {
  userService: string;
  uploadService: string;
  catalogService: string;
  transcodeService: string;
  aiService: string;
  streamingService: string;
  notificationService: string;
}

export const servicesConfig = registerAs('services', (): ServicesConfig => ({
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  uploadService: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3002',
  catalogService: process.env.CATALOG_SERVICE_URL || 'http://localhost:3003',
  transcodeService: process.env.TRANSCODE_SERVICE_URL || 'http://localhost:3004',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:3005',
  streamingService: process.env.STREAMING_SERVICE_URL || 'http://localhost:3006',
  notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
}));
