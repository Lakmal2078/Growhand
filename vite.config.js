import { defineConfig } from 'vite';

const securityHeaders = {
  'Permissions-Policy': 'camera=(self)',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN'
};

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
