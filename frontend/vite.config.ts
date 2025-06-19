import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',         // ⬅️ Ensures Vite runs on 127.0.0.1 instead of localhost
    port: 5173,                // ⬅️ Ensures Spotify redirects to the correct port
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
