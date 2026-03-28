import { Pool } from 'pg';
// import dotenv from 'dotenv';

// dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rag_db',
});

pool.on('connect', () => {
    console.log('Connected to Postgres');
});

pool.on('error', (error) => {
    console.error('Unexpected Postgres error:', error);
});

export default pool;