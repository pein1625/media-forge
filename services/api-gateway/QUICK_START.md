# API Gateway Quick Start

## Get Started in 5 Minutes

### 1. Setup Environment
```bash
cp .env.example .env
```

### 2. Install & Run
```bash
npm install
npm run start:dev
```

Server runs on `http://localhost:3000`.

### 3. Test Health Endpoint
```bash
curl http://localhost:3000/api/v1/health
```

Response:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2026-04-12T10:00:00.000Z",
  "uptime": 42
}
```

### 4. Check All Services
```bash
curl http://localhost:3000/api/v1/health/services
```

## Example: Making Authenticated Requests

### 1. Login (no auth required)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Use Token for Protected Routes
```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Environment Variables

Key variables in `.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3000 | Server port |
| `JWT_SECRET` | your-secret-key | JWT signing key |
| `NODE_ENV` | development | Environment |
| `CORS_ORIGIN` | * | Allowed origins |

## Service URLs

Configure where each service runs:

```env
USER_SERVICE_URL=http://localhost:3001
UPLOAD_SERVICE_URL=http://localhost:3002
CATALOG_SERVICE_URL=http://localhost:3003
TRANSCODE_SERVICE_URL=http://localhost:3004
AI_SERVICE_URL=http://localhost:3005
STREAMING_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

## Route Guide

All routes start with `/api/v1`:

| Route | Auth | Service |
|-------|------|---------|
| `/auth/*` | No | user-service |
| `/users/*` | Yes | user-service |
| `/upload/*` | Yes | upload-service |
| `/media/*` | Optional | catalog-service |
| `/stream/*` | Optional | streaming-service |
| `/transcode/*` | Yes | transcode-service |
| `/ai/*` | Yes | ai-service |
| `/notifications/*` | Yes | notification-service |

## Common Tasks

### Add a New Service Route

In `src/proxy/proxy.controller.ts`:

```typescript
@All('/myservice/*')
@UseGuards(JwtAuthGuard)
async myServiceProxy(
  @Req() req: AuthenticatedRequest,
  @Res() res: Response,
): Promise<void> {
  this.attachUserHeaders(req);
  const path = req.path.replace('/api/v1/myservice', '');
  await this.proxyRequest(res, 'my-service', path, req);
}
```

Then in `.env`:
```env
MY_SERVICE_URL=http://localhost:3008
```

And in `src/config/services.config.ts`:
```typescript
myService: process.env.MY_SERVICE_URL || 'http://localhost:3008'
```

### Enable Public Access to a Route

Use `OptionalAuthGuard` instead of `JwtAuthGuard`:

```typescript
@All('/public/*')
@UseGuards(OptionalAuthGuard)
async publicProxy(
  @Req() req: AuthenticatedRequest,
  @Res() res: Response,
): Promise<void> {
  // req.user will be null if no token provided
  if (req.user) {
    this.attachUserHeaders(req);
  }
  // ... rest of code
}
```

### Debug Requests

Enable request logging by adding to `proxy.service.ts`:

```typescript
this.logger.debug(`Forwarding ${method.toUpperCase()} ${targetUrl}`);
this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
```

## Troubleshooting

### Port Already in Use
```bash
PORT=3001 npm run start:dev
```

### Service Not Found
Check:
1. Service URL in `.env` is correct
2. Service is running on that port
3. Service has `/health` endpoint

### JWT Validation Failed
- Verify `JWT_SECRET` in `.env`
- Check token format: `Authorization: Bearer <token>`
- Ensure token hasn't expired

## Files Structure Reference

```
src/
├── main.ts                  - App bootstrap
├── app.module.ts            - Root module
├── auth/
│   ├── auth.module.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── optional-auth.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── proxy/
│   ├── proxy.controller.ts  - Route handlers
│   ├── proxy.service.ts     - Forwarding logic
│   └── proxy.module.ts
├── health/
│   ├── health.controller.ts - /health endpoints
│   ├── health.service.ts
│   └── health.module.ts
├── config/
│   └── services.config.ts   - Service URLs
└── middleware/
    └── request-id.middleware.ts
```

## Scripts

```bash
npm run start:dev      # Development with hot-reload
npm run build          # Build for production
npm run start:prod     # Run compiled code
```

## Next: Add Your First Service

1. Start the gateway: `npm run start:dev`
2. Start a downstream service on port 3001+
3. Add route to gateway
4. Test: `curl http://localhost:3000/api/v1/your-route`
