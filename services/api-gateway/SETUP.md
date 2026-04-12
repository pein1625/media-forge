# API Gateway Service Setup

## Overview

This is the API Gateway service for the Media Forge microservices architecture. It acts as the main entry point for all client requests, handling:

- Request routing to downstream services
- JWT authentication and authorization
- Rate limiting (100 requests per 60 seconds)
- Request ID tracking
- Health monitoring
- CORS and security headers

## Project Structure

```
api-gateway/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── optional-auth.guard.ts
│   ├── config/
│   │   └── services.config.ts   # Service URL configuration
│   ├── health/                  # Health check endpoints
│   │   ├── health.module.ts
│   │   ├── health.service.ts
│   │   └── health.controller.ts
│   ├── middleware/
│   │   └── request-id.middleware.ts  # UUID request tracking
│   ├── proxy/                   # Request routing
│   │   ├── proxy.module.ts
│   │   ├── proxy.service.ts
│   │   └── proxy.controller.ts
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Bootstrap file
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── .gitignore
```

## Installation

1. Copy `.env.example` to `.env` and configure environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

## Configuration

Edit `.env` file with your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*

# Downstream Services
USER_SERVICE_URL=http://localhost:3001
UPLOAD_SERVICE_URL=http://localhost:3002
CATALOG_SERVICE_URL=http://localhost:3003
TRANSCODE_SERVICE_URL=http://localhost:3004
AI_SERVICE_URL=http://localhost:3005
STREAMING_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

## Running

### Development Mode

```bash
npm run start:dev
```

Runs with hot-reload on port 3000.

### Production Build

```bash
npm run build
npm run start:prod
```

## API Routes

All routes are prefixed with `/api/v1`.

### Authentication (No Auth Required)
- `*` `/auth/*` → Routes to user-service

### Protected Routes (JWT Required)
- `*` `/users/*` → Routes to user-service
- `*` `/upload/*` → Routes to upload-service
- `*` `/transcode/*` → Routes to transcode-service
- `*` `/ai/*` → Routes to ai-service
- `*` `/notifications/*` → Routes to notification-service

### Public Routes (Optional Auth)
- `*` `/media/*` → Routes to catalog-service
  - GET requests: allowed without authentication
  - POST/PUT/PATCH/DELETE: requires authentication
- `*` `/stream/*` → Routes to streaming-service

### Health Checks
- `GET /health` → Gateway health status
- `GET /health/services` → All downstream services health status

## Authentication

The gateway uses JWT (JSON Web Tokens) for authentication:

1. Users authenticate with the user-service at `/auth/login`
2. They receive a JWT token in the response
3. For protected routes, include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Headers

The gateway automatically attaches user information to proxied requests:

- `X-User-Id` - User ID from JWT
- `X-User-Email` - User email from JWT
- `X-User-Role` - User role from JWT
- `X-Request-Id` - Unique request identifier (auto-generated if not present)

## Rate Limiting

The gateway enforces rate limiting:

- **Limit**: 100 requests
- **Window**: 60 seconds

Rate limit errors return HTTP 429 (Too Many Requests).

## Error Handling

The gateway returns appropriate HTTP status codes:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User lacks required permissions
- `404 Not Found` - Route not found
- `429 Too Many Requests` - Rate limit exceeded
- `503 Service Unavailable` - Downstream service unavailable

## Middleware

### Request ID Middleware
Automatically assigns a unique UUID to each request via the `X-Request-Id` header for tracing.

### Security Headers
- Helmet.js for security headers (Content-Security-Policy, X-Frame-Options, etc.)
- CORS configuration for cross-origin requests

### Compression
Enables gzip compression for response payloads.

## Development Notes

- Uses class-validator and class-transformer for DTO validation
- Implements NestJS best practices (modules, services, controllers, guards)
- All services are configurable via environment variables
- Comprehensive error logging through NestJS Logger

## Troubleshooting

### Service Unavailable (503)
- Check that downstream services are running
- Verify service URLs in .env configuration
- Check network connectivity between services

### Unauthorized (401)
- Ensure JWT token is valid
- Verify JWT_SECRET matches the token signing secret
- Check token hasn't expired

### Rate Limited (429)
- Wait for the rate limit window to reset (60 seconds)
- Increase limit or window in app.module.ts if needed

## Next Steps

1. Ensure all downstream services have `/health` endpoints
2. Configure JWT_SECRET for production
3. Update CORS_ORIGIN for production domains
4. Set up monitoring and logging aggregation
5. Configure service URLs for your deployment environment
