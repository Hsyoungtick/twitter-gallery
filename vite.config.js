import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || 'http://localhost:3000/api'
  const backendUrl = apiBase.replace(/\/api$/, '')
  const port = parseInt(env.VITE_PORT || '5173', 10)

  return {
    plugins: [vue()],
    server: {
      port,
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
    },
    preview: {
      port,
      host: '0.0.0.0',
    }
  }
})
