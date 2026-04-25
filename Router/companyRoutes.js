import express from 'express';
import { ingestCompany } from '../services/langChain/ingestCompany.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post("/ingest", async (req, res) => {
    try {
        const { companyName } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: "companyName is required in the payload" });
        }

        const result = await ingestCompany({ companyName });

        res.json(result);
    } catch (error) {
        logger.error("Company ingest failed:", error);
        res.status(500).json({ error: "Company ingest failed" });
    }
});

export default router;