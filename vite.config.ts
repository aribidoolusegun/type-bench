import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A relative base keeps the built site portable: dist/ can be served from
// any path (a subfolder, GitHub Pages, a static host) without rebuilding.
export default defineConfig({
  base: './',
  plugins: [react()],
})
