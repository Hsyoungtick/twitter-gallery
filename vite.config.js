import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = parseInt(env.VITE_PORT || '5173', 10)

  return {
    base: process.env.VITE_BASE || '/',
    plugins: [vue()],
    server: {
      port,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/video': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/pic': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
  }
})
