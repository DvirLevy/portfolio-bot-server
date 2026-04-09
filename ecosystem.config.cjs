module.exports = {
    apps: [
        {
            name: "portfolio-bot",
            script: "server.js",
            cwd: "/home/ec2-user/portfolio-bot-server",
            // Merges logs from all instances into one file (easier to tail)
            combine_logs: true,
            // Adds a clear timestamp to every line in the log files
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            env_production: {
                NODE_ENV: "production"
            },
            // Auto-restart if the app crashes
            autorestart: true,
            // Delay between restarts to avoid infinite loops on fatal errors
            exp_backoff_restart_delay: 100,
            // Important for logs: ensures stdout/stderr are correctly piped
            out_file: "logs/app-out.log",
            error_file: "logs/app-error.log"
        }
    ]
}