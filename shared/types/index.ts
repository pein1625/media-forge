/**
 * Shared Types - Media Forge Microservices
 * Common interfaces and types used across all services
 */

// === Media Type Enums ===
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum MediaStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// === Event Envelope ===
export interface MediaEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
  correlationId: string;
  userId: string;
  payload: T;
}

// === Event Payloads ===
export interface MediaUploadedPayload {
  mediaId: string;
  fileName: string;
  mediaType: MediaType;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface TranscodeRequestedPayload {
  mediaId: string;
  sourceFormat: string;
  targetFormat: string;
  quality: string;
  requestedBy: string;
  requestedAt: Date;
  options?: Record<string, any>;
}

export interface TranscodeCompletedPayload {
  mediaId: string;
  sourceFormat: string;
  targetFormat: string;
  outputPath: string;
  fileSize: number;
  duration?: number;
  completedAt: Date;
  success: boolean;
  error?: string;
}

export interface AiCompletedPayload {
  mediaId: string;
  analysisType: string;
  results: Record<string, any>;
  completedAt: Date;
  success: boolean;
  error?: string;
}

// === Pagination ===
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// === API Response ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}
