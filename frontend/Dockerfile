FROM node:22-alpine AS base
ARG NPM_REGISTRY
WORKDIR /app

# Copy root workspace config + lock file for version pinning
COPY package.json package-lock.json ./

# Copy both workspace package.json so npm can resolve the workspace list
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install ONLY the frontend workspace, --ignore-scripts for speed & security
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm ci --workspace=frontend --ignore-scripts

# Copy frontend source code
COPY frontend/ frontend/

# ---- Dev Stage ----
FROM base AS development
WORKDIR /app/frontend
EXPOSE 5174
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- Prod Stage ----
FROM base AS builder
ARG VITE_API_BASE_URL
WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
