import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 4000, // Raises warning threshold to 4MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/molstar')) {
            return 'molstar';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
        }
      }
    }
  }
});