FROM node:20-alpine AS base
WORKDIR /app

# Copy shared libs first (they're dependencies)
COPY shared/ ./shared/

# Copy service files
COPY services/user-service/package.json ./services/user-service/
WORKDIR /app/services/user-service
RUN npm install
# Symlink so shared libs can resolve @nestjs/* packages via node_modules walk-up
RUN ln -s /app/services/user-service/node_modules /app/node_modules

# Copy source code
COPY services/user-service/ ./

# Build
RUN npm run build

# ─── Production stage ───────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/shared ./shared
COPY --from=base /app/services/user-service/package.json ./
COPY --from=base /app/services/user-service/dist ./dist
COPY --from=base /app/services/user-service/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/services/user-service/src/main"]
