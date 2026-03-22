import express from 'express';
import { createStream, startStream, handleIce, handleTalk, deleteStream } from '../BL/didBL.js';

const router = express.Router();

router.post('/create-stream', createStream);
router.post('/start-stream/:stream_id', startStream);
router.post('/ice/:stream_id', handleIce);
router.post('/talk/:stream_id', handleTalk);
router.delete('/stream/:stream_id', deleteStream);

export default router;
