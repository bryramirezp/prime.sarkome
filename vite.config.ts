import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // CORS proxy configuration for development
        proxy: {
          '/api/kg': {
            target: 'https://kg.sarkome.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/kg/, ''),
            secure: false, // Allow self-signed certificates
            ws: true,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        }
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
