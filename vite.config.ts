import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 设置 @ 指向 src 目录，方便引入
    }
  },
  server: {
    port: 5197, // 前端端口
    proxy: {
      // 只要看到 /api 开头的请求，都转发给后端
      '/api': {
        target: 'http://localhost:8727', // 后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 去掉 /api 前缀再发给后端
      }
    }
  }
})