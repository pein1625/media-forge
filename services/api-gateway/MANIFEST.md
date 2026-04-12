# API Gateway Service - File Manifest

## Project Location
`/sessions/focused-bold-goodall/mnt/media-forge/services/api-gateway`

## File Listing

### Configuration & Project Files (5 files)
1. **package.json** - NPM package configuration
   - All dependencies for NestJS gateway
   - Build and start scripts
   
2. **tsconfig.json** - TypeScript configuration
   - ES2021 target with strict mode
   - Path aliases for shared modules
   
3. **nest-cli.json** - NestJS CLI configuration
   - Standard configuration for CLI tools
   
4. **.env.example** - Environment variables template
   - Copy to .env and configure for your deployment
   
5. **.gitignore** - Git ignore patterns
   - Standard Node/TypeScript ignores

### Core Application (2 files)
6. **src/main.ts** - Application bootstrap
   - Creates NestJS app with all middleware
   - Enables Helmet, compression, CORS
   - Sets global prefix and validation pipe
   - Runs on configurable PORT (default 3000)
   
7. **src/app.module.ts** - Root application module
   - Imports ConfigModule, ThrottlerModule
   - Imports AuthModule, ProxyModule, HealthModule

### Authentication Module (4 files)
8. **src/auth/auth.module.ts** - Authentication module
   - Registers JwtModule with configurable secret
   - Imports PassportModule
   - Provides JwtAuthGuard and OptionalAuthGuard
   
9. **src/auth/strategies/jwt.strategy.ts** - JWT validation
   - Extracts Bearer token from Authorization header
   - Validates against JWT_SECRET
   - Returns user context (userId, email, role)
   
10. **src/auth/guards/jwt-auth.guard.ts** - Required JWT guard
    - Enforces authentication on protected routes
    - Throws 401 if token missing or invalid
    
11. **src/auth/guards/optional-auth.guard.ts** - Optional JWT guard
    - Allows requests with or without token
    - Returns null if token not provided

### Proxy Module (3 files)
12. **src/proxy/proxy.module.ts** - Proxy module
    - Imports HttpModule and AuthModule
    - Provides ProxyService
    
13. **src/proxy/proxy.service.ts** - Request forwarding service
    - Maps service names to URLs
    - Forwards HTTP requests to downstream services
    - Preserves method, path, query, body, headers
    - Handles errors (503 for unavailable, 502 for errors)
    
14. **src/proxy/proxy.controller.ts** - Route handlers
    - 8 route groups with @All() decorator:
      - /auth/* (public)
      - /users/* (authenticated)
      - /upload/* (authenticated)
      - /media/* (optional auth, mutations require auth)
      - /stream/* (optional auth)
      - /transcode/* (authenticated)
      - /ai/* (authenticated)
      - /notifications/* (authenticated)
    - Attaches user headers (X-User-Id, X-User-Email, X-User-Role)
    - Delegates to ProxyService for forwarding

### Health Module (3 files)
15. **src/health/health.module.ts** - Health check module
    - Provides HealthService
    
16. **src/health/health.service.ts** - Health check service
    - getBasicHealth() - returns gateway status with uptime
    - getAggregatedHealth() - pings all services, returns aggregated status
    - Calculates overall status (ok/degraded/down)
    
17. **src/health/health.controller.ts** - Health endpoints
    - GET /health - gateway status
    - GET /health/services - all services status

### Middleware & Configuration (2 files)
18. **src/middleware/request-id.middleware.ts** - Request ID tracking
    - Generates UUID for each request if not present
    - Attaches to X-Request-Id header
    - Preserves existing X-Request-Id if provided
    
19. **src/config/services.config.ts** - Service URL configuration
    - Registers configuration for service URLs
    - Provides defaults for all 7 services
    - Uses environment variables

### Documentation (2 files)
20. **SETUP.md** - Comprehensive setup guide
    - Installation instructions
    - Configuration details
    - API routes reference
    - Authentication guide
    - Rate limiting info
    - Error handling guide
    - Troubleshooting
    
21. **QUICK_START.md** - Quick reference guide
    - 5-minute setup
    - Health endpoint test
    - Authenticated request example
    - Route quick reference
    - Common tasks and recipes
    - Environment variables table

## Configuration Summary

### Environment Variables Required

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*

# Service URLs
USER_SERVICE_URL=http://localhost:3001
UPLOAD_SERVICE_URL=http://localhost:3002
CATALOG_SERVICE_URL=http://localhost:3003
TRANSCODE_SERVICE_URL=http://localhost:3004
AI_SERVICE_URL=http://localhost:3005
STREAMING_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

## Key Features

### Authentication
- JWT token validation
- Bearer token extraction
- Protected and optional auth routes
- User context propagation

### Request Routing
- Wildcard routing with @All() decorator
- 8 different route groups
- Path rewriting for service names
- Method preservation (GET, POST, PUT, PATCH, DELETE)

### Security
- Helmet.js security headers
- CORS configuration
- Request validation
- Input whitelist and transformation
- Rate limiting (100 req/60s)

### Monitoring
- Gateway health status with uptime
- Downstream service health checks
- Aggregated service status
- Response time tracking

### Request Tracking
- Automatic UUID generation
- X-Request-Id header propagation
- User context headers

### Error Handling
- 503 Service Unavailable (connection failed)
- 502 Bad Gateway (downstream error)
- 401 Unauthorized (no auth)
- 429 Too Many Requests (rate limited)

## Build & Run

### Development
```bash
npm install
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Dependencies

### Core
- @nestjs/common, @nestjs/core, @nestjs/platform-express (10.3.0)
- typescript 5.3

### Features
- @nestjs/config - environment management
- @nestjs/jwt, @nestjs/passport - authentication
- @nestjs/throttler - rate limiting
- @nestjs/axios - HTTP client
- axios - underlying HTTP
- helmet - security headers
- compression - gzip
- class-validator, class-transformer - validation
- uuid - request IDs
- ioredis - redis client (future)

## Architecture

```
Request Flow:
1. Client request arrives at api-gateway port 3000
2. RequestIdMiddleware generates/preserves X-Request-Id
3. Request matched to route handler (@All pattern)
4. Authentication guard applied (if configured)
5. User context extracted from JWT
6. Headers augmented with user info
7. ProxyService forwards to downstream service
8. Response returned with status/headers/body preserved
9. X-Request-Id included in response
```

## Next Steps

1. Review SETUP.md and QUICK_START.md
2. Copy .env.example to .env
3. Configure service URLs
4. Install dependencies (npm install)
5. Start in development (npm run start:dev)
6. Test health endpoint
7. Configure downstream services
8. Build for production

## Support Files

All files are complete and production-ready. No additional setup files needed.
