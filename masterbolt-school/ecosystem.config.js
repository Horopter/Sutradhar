// PM2 configuration for Node.js hosting on Hostinger VPS
module.exports = {
  apps: [{
    name: 'masterbolt-school',
    script: 'output-temp/server/index.mjs',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NITRO_PORT: 3000,
      NITRO_HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}

