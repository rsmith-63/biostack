import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      output: {
        // Automatically split major third-party libraries into independent bundles
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('molstar')) {
              return 'vendor-molstar';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            // Collects standard libraries like react, zod, etc.
            return 'vendor-core'; 
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
    css: true,
  },
});
