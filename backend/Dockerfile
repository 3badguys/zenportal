FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app

# Copy root workspace config + lock file for version pinning
COPY package.json package-lock.json ./

# Copy workspace package.json + prisma schema (needed for prisma generate)
COPY backend/package.json backend/
COPY backend/prisma backend/prisma
COPY frontend/package.json frontend/

# Install ONLY the backend workspace, --ignore-scripts for speed & security
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm ci --workspace=backend --ignore-scripts \
    && cd backend && npx prisma generate

# Copy backend source code
COPY backend/ backend/

# ---- Development (hot reload) ----
FROM base AS development
WORKDIR /app/backend
EXPOSE 3000
CMD ["npx", "nest", "start", "--watch"]

# ---- Builder (compile + prune) ----
FROM base AS builder
WORKDIR /app/backend
RUN npm run build \
    && ls dist/main.js \
    && npm prune --production \
    && find dist \( -name '*.d.ts' -o -name '*.js.map' \) -delete

# ---- Production (minimal runtime) ----
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./
COPY --from=builder /app/backend/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
