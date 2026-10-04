const path = require('path')

// cwd ديناميكي: يعمل أينما نُسخ المشروع (كان '/a' ثابتاً = فقدان جلسة عند النشر).
// المسارات داخل المشروع كلها مطلقة الآن، لكن cwd يبقى ضرورياً لـ node_modules.
module.exports = {
  apps: [{
    name: 'leen-bot',
    script: path.join(__dirname, 'index.js'),
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    kill_timeout: 10000,
    // مهم: يتيح global.gc لمؤقّت جمع القمامة في index.js
    node_args: ['--max-old-space-size=512', '--expose-gc'],
    env: {
      NODE_ENV: 'production'
    }
  }]
}