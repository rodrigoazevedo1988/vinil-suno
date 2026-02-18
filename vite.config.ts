import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3078,
      host: '0.0.0.0',
      proxy: {
        // Proxy das chamadas /api para o backend local na porta 5043
        '/api': {
          target: 'http://localhost:5043',
          changeOrigin: true,
        },
        // Proxy dos uploads também
        '/uploads': {
          target: 'http://localhost:5043',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
