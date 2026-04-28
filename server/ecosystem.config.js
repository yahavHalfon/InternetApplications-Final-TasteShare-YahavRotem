module.exports = {
  apps: [
    {
      name: 'tasteshare-server',
      script: './dist/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development',
        ENV_FILE: '.env.dev',
      },
      env_production: {
        NODE_ENV: 'production',
        ENV_FILE: '.env.prod',
      },
    },
  ],
};