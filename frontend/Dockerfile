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
ARG FRONTEND_PORT
WORKDIR /app/frontend
EXPOSE $FRONTEND_PORT
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- Prod Stage ----
FROM base AS builder
ARG VITE_API_BASE_URL
WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine AS production
# Default so envsubst always has the var even when run standalone (no compose env);
# value comes from build arg (compose passes ${BACKEND_PORT} from root .env)
ARG BACKEND_PORT
ENV BACKEND_PORT=$BACKEND_PORT
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# envsubst template: rendered at container start from BACKEND_PORT env var, substitutes proxy_pass target port
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
