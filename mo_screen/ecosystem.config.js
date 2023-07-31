module.exports = {
  apps: [
    {
      name: 'Kitchen MO Screen',
      port: '3000',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs'
    }
  ]
}

