module.exports = {
    apps: [
        {
            name: "app",
            script: "server.js",
            cwd: "/home/ec2-user/portfolio-bot-server",
            env_production: {
                NODE_ENV: "production"
            }
        }
    ]
}