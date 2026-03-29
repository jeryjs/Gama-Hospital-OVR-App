/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config(); // loads .env in this folder

module.exports = {
    apps: [
        {
            name: 'ovr-app',
            script: 'pnpm',
            args: 'start',
            env: {
                PORT: 3005,
                NODE_ENV: 'development',
                NEXTAUTH_URL: 'http://localhost:3005'
            },
            env_production: {
                NODE_ENV: "production",
                PORT: "6203",
                NEXTAUTH_URL: "https://gama-ovr.jeryjs.dev"
            },
            exec_mode: "fork",
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            error_file: process.env.DEPLOY_PATH + "/logs/error.log",
            out_file: process.env.DEPLOY_PATH + "/logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
    // ssh ju_jery "cd ~/all-projects/Gama-Hospital-OVR-App && git pull && pnpm i && pnpm build && pm2 reload ovr-app"
    deploy: {
        production: {
            user: process.env.DEPLOY_SSH_USER,
            host: process.env.DEPLOY_HOST,
            ref: 'origin/main',
            repo: process.env.DEPLOY_REPO,
            path: process.env.DEPLOY_PATH,
            'post-deploy': 'git pull && pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
        },
    },
};
