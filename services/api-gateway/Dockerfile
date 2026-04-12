FROM node:20-alpine AS base
WORKDIR /app

# Copy shared libs first (they're dependencies)
COPY shared/ ./shared/

# Copy service files
COPY services/api-gateway/package.json ./services/api-gateway/
WORKDIR /app/services/api-gateway
RUN npm install
# Symlink so shared libs can resolve packages via node_modules walk-up
RUN ln -s /app/services/api-gateway/node_modules /app/node_modules

# Copy source code
COPY services/api-gateway/ ./

# Build
RUN npm run build

# ─── Production stage ───────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/shared ./shared
COPY --from=base /app/services/api-gateway/package.json ./
COPY --from=base /app/services/api-gateway/dist ./dist
COPY --from=base /app/services/api-gateway/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main"]
