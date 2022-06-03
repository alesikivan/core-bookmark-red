module.exports = {
  apps : [{
    script: './index.js',
    env : {
      'PORT': 80,
      'NODE_ENV' : 'production'
    }
  }],

  deploy : {
    production : {
      user : 'root',
      host : ['45.93.136.98'],
      ref  : 'origin/main',
      repo : 'https://github.com/alesikivan/core-bookmark-red',
      path : '/root/apps/bookmark-core',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
