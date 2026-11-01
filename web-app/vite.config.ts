import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: true,
    allowedHosts: ['pyrotechnic-caroline-dankly.ngrok-free.dev'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách các thư viện nặng thành chunk riêng → cache tốt, không tải lại khi đổi trang.
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          qr: ['html5-qrcode', 'qrcode.react'],
        },
      },
    },
  },
});
