module.exports = {
  apps: [
    {
      name: 'twitter-gallery',
      script: 'index.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5173,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
}
