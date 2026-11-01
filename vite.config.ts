import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work on both account pages and repository subdirectories.
  base: process.env.VITE_BASE_PATH || './',
});
