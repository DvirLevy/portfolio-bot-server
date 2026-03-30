import express from 'express';
import didRoute from './didRoute.js';
import chatRoute from './chatRoute.js';
import ragRoutes from './ragRoutes.js';

const router = express.Router();

router.use('/did', didRoute);
router.use('/chat', chatRoute);
router.use('/rag', ragRoutes);

export default router;
