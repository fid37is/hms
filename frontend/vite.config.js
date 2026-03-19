// hms/frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow Vite to serve files from outside frontend/
      // so it can reach ../../hotel-website/src/components/sections/
      allow: ['..', '../../hotel-website'],
    },
  },
  resolve: {
    caseSensitive: true,
  },
})