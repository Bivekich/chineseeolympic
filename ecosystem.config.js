module.exports = {
  apps: [
    {
      name: 'chinesestar',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
