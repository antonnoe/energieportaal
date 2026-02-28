/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/energieportaal/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
});
