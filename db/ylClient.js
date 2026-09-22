import pg from 'pg';
const { Pool } = pg;

let pool;

export function getYlConnectionOptions() {
    return {
        host: process.env.YL_DB_HOST || "localhost",
        port: process.env.YL_DB_PORT ? parseInt(process.env.YL_DB_PORT, 10) : 5433,
        user: process.env.YL_DB_USER || "postgres",
        password: process.env.YL_DB_PASSWORD || "postgres",
        database: process.env.YL_DB_NAME || "yl_db",
    };
}

export function getYlPool() {
    if (!pool) {
        pool = new Pool(getYlConnectionOptions());

        pool.on('error', (err) => {
            console.error('Unexpected error on idle YL client', err);
            process.exit(-1);
        });
    }
    return pool;
}
