import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // server: {
  //   host: '0.0.0.0', // Binds to all network interfaces (recommended)
  //   port: 5174, // Default port, adjust if needed
  // },
});
