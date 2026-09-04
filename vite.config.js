import { defineConfig } from 'vite';

const cameraHeaders = {
  'Permissions-Policy': 'camera=(self)'
};

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    headers: cameraHeaders
  },
  preview: {
    headers: cameraHeaders
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
