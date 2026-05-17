import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || 'http://localhost:3000/api'
  const backendUrl = apiBase.replace(/\/api$/, '')

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/video': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/pic': {
          target: backendUrl,
          changeOrigin: true,
        }
      }
    }
  }
})
