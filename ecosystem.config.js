module.exports = {
  apps: [{
    name: 'leen-bot',
    script: 'index.js',
    cwd: '/a',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
