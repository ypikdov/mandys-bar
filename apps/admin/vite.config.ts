import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "xlsx": path.resolve(__dirname, "../../node_modules/xlsx/xlsx.mjs"),
    },
    mainFields: ['module', 'browser', 'main'],
  },
  ssr: {
    noExternal: ['@supabase/*'],
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    esbuildOptions: {
      mainFields: ['module', 'browser', 'main'],
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          'vendor-reports': ['jspdf', 'jspdf-autotable']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
