import { defineConfig } from 'vite';

export default defineConfig({
  // base relativo: permite publicar em hospedagem estática em qualquer subcaminho
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 5173,
    open: false
  }
});
