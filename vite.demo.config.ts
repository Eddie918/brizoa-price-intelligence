import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: 'demo', base: '/brizoa-price-intelligence/',
  publicDir: '../public',
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  plugins: [react()],
  build: { outDir: '../dist-demo', emptyOutDir: true },
});
