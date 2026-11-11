module.exports = {
  apps: [
    {
      name: 'qadri-gadgets-api',
      script: './server.js',
      // Cluster mode enabled for PostgreSQL; set to 1 if running standalone file-based db.json
      instances: process.env.DATABASE_URL ? 'max' : 1,
      exec_mode: process.env.DATABASE_URL ? 'cluster' : 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
    {
      name: 'qadri-gadgets-cron-backup',
      script: './pg-backup.js',
      cron_restart: '0 3 * * *', // Run automated backup daily at 3:00 AM
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
