import express from "express";
import { ingest } from "../services/langChain/ingest.service.js";
import { askOrchestrator } from "../services/langChain/ask/askOrchestrator.service.js";
import { ingestQA } from "../services/langChain/ingestQA.service.js";
import { logger } from "../utils/logger.js";
import companyRoutes from "./companyRoutes.js";
const router = express.Router();

router.use('/company', companyRoutes);


router.post("/ingest", async (req, res) => {
    try {
        const { text, documentId, metadata } = req.body;

        const result = await ingest({ text, documentId, metadata });

        res.json(result);
    } catch (error) {
        logger.error("Ingest failed:", error);
        res.status(500).json({ error: "Ingest failed" });
    }
});

router.post("/ingestQA", async (req, res) => {
    try {
        // If the body is structured like { "qaArray": [...] }, extract it.
        // If the body is just an array directly [ {...}, {...} ], then use req.body directly.
        const qnaData = req.body.qnaData || req.body;
        logger.info(`received array of length ${qnaData.length}`);

        const result = await ingestQA(qnaData);

        res.json(result);
    } catch (error) {
        logger.error("QA Ingest failed:", error);
        res.status(500).json({ error: "Ingest failed" });
    }
});

router.post("/ask", async (req, res) => {
    try {
        const { question, language, onRender } = req.body;
        logger.info(`\x1b[36m$received question: ${question}\x1b[0m`);

        const result = await askOrchestrator(question, language, onRender);

        res.json(result);
    } catch (error) {
        logger.error("Ask failed:", error);
        res.status(500).json({ error: "Ask failed" });
    }
});


export default router;