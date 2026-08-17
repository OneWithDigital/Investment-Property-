// PM2 process config. Run with: pm2 start ecosystem.config.js
// See DEPLOYMENT.md for full setup steps.
module.exports = {
  apps: [
    {
      name: "investment-property",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
