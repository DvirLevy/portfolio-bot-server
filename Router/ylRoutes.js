import express from 'express';
import multer from 'multer';
import { startScan, getScanStatus } from '../services/yl/scanDocument.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            return cb(new Error('UNSUPPORTED_FILE_TYPE'));
        }
        cb(null, true);
    },
});

function runMulter(req, res) {
    return new Promise((resolve, reject) => {
        upload.single('file')(req, res, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

router.post('/scan', async (req, res) => {
    try {
        await runMulter(req, res);

        if (!req.file) {
            return res.status(400).json({ error: 'file is required in the payload' });
        }

        const result = await startScan({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalFilename: req.file.originalname,
        });

        res.status(202).json(result);
    } catch (error) {
        if (error.message === 'UNSUPPORTED_FILE_TYPE') {
            return res.status(400).json({ error: 'Only PDF and DOCX files are supported' });
        }
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit` });
        }
        logger.error('Scan upload failed:', error);
        res.status(500).json({ error: 'Scan upload failed' });
    }
});

router.get('/scan/:id', async (req, res) => {
    try {
        const doc = await getScanStatus(req.params.id);

        if (!doc) {
            return res.status(404).json({ error: 'Scan not found' });
        }

        logger.info('Scan status poll', { scanId: doc.id, status: doc.status });

        res.json(doc);
    } catch (error) {
        logger.error('Get scan status failed:', error);
        res.status(500).json({ error: 'Get scan status failed' });
    }
});

export default router;
