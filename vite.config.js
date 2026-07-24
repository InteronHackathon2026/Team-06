import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy to your Arduino/ESP32 backend server (e.g. a Flask/Node bridge
      // reading serial data from the Arduino and re-broadcasting over HTTP/WS).
      // Point this at wherever that bridge runs.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
