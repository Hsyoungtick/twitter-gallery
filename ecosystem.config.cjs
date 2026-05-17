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
      args: 'preview --host 0.0.0.0 --port 5173',
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
