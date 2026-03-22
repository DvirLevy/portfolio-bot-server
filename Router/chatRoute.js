import express from 'express';
import { chatWithAvatar } from '../BL/chatBL.js';

const router = express.Router();

router.post('/', chatWithAvatar);

export default router;
