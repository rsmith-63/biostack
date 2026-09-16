import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sets root relative to where index.html is if needed
  root: 'src/client',
  build: {
    // Outputs build files to dist at the root of the project
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          molstar: ['molstar']
        }
      }
    }
  }
});