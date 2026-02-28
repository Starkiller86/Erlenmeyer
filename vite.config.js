import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.argv': [],
    'process': { env: {}, argv: [], version: '' }
  },
  server: {
    host: true,    
    port: 5174,    
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    }
  }
});