import express from 'express';
import didRoute from './didRoute.js';
import chatRoute from './chatRoute.js';

const router = express.Router();

router.use('/did', didRoute);
router.use('/chat', chatRoute);

export default router;
