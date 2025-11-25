import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
    proxy: {
      // 代理 Transmission RPC 请求
      '/transmission': {
        target: 'http://127.0.0.1:9091',
        changeOrigin: true,
      },
    },
  },
})
