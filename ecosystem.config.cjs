const fs = require('fs')
const path = require('path')

let vitePort = 5173
try {
  const envPath = path.join(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/VITE_PORT\s*=\s*(\d+)/)
    if (match) vitePort = parseInt(match[1], 10)
  }
} catch (e) {}

module.exports = {
  apps: [
    {
      name: 'tg-backend',
      script: 'index.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'tg-frontend',
      script: './node_modules/vite/bin/vite.js',
      args: `preview --host 0.0.0.0 --port ${vitePort}`,
      cwd: './',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
}
