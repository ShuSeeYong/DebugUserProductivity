import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // In production the app is served from the /DebugUserProductivity/ subfolder,
  // so built assets must reference that path. In dev, serve from root so
  // http://localhost:5173/ works with `npm run dev`.
  base: command === 'build' ? '/DebugUserProductivity/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      // SOAP web service for login
      '/soap': {
        target: 'http://penesdev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soap/, '/jtesw_ws/jtesw_webservice.asmx'),
      },
      // All other APIs go to the existing server
      '/api': {
        target: 'http://mypenm7esdev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/DebugUserAPI'),
      },
    },
  },
}))
