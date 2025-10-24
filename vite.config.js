import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 分離 React 核心庫
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 分離 Firebase 相關
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // 分離 UI 組件庫
          'ui-vendor': ['lucide-react'],
          // 分離大型組件
          'dashboard': ['./src/components/Dashboard.jsx'],
          'customer-management': ['./src/components/CustomerManagement.jsx'],
          'booking-management': ['./src/components/BookingManagement.jsx'],
          'service-management': ['./src/components/ServiceManagement.jsx'],
          'visit-management': ['./src/components/VisitManagement.jsx'],
          'message-center': ['./src/components/MessageCenter.jsx'],
          'content-management': ['./src/components/ContentManagement.jsx'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // 啟用壓縮 (使用 esbuild 更快)
    minify: 'esbuild',
    // 移除 console 和 debugger
    target: 'es2015',
    cssCodeSplit: true,
  },
})
