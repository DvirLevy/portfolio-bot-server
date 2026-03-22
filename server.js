import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiIndexRoute from './Router/apiIndexRoute.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile, override: true });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiIndexRoute);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
