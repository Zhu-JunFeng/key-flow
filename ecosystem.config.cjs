module.exports = {
  apps: [
    {
      name: 'typing-race',
      script: 'server/src/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx/esm',
      cwd: '/opt/typing-race',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/typing-race/logs/error.log',
      out_file: '/opt/typing-race/logs/out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
    },
  ],
};
