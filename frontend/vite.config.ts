import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Read frontend/.env (incl. non-VITE_ prefixed vars); ports come from .env
  // process.env wins: docker compose injected runtime values > .env file
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const frontendPort = Number(env.FRONTEND_PORT) || 5173;
  const backendPort = env.BACKEND_PORT || '3000';
  // Comma-separated list of allowed Host headers, e.g. "zenportal.example.com,dev.example.com".
  // Unset → Vite default (localhost/127.0.0.1/::1 only).
  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',').map((h) => h.trim())
    : undefined;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      allowedHosts,
      proxy: {
        '/api': `http://host.docker.internal:${backendPort}`,
        '/media': `http://host.docker.internal:${backendPort}`,
      },
    },
  };
});
