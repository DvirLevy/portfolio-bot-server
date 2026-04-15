import express from "express";
import { ingest } from "../services/langChain/ingest.service.js";
import { ask } from "../services/langChain/ask.service.js";
import { ingestQA } from "../services/langChain/ingestQA.service.js";
import { logger } from "../services/logger.js";
const router = express.Router();

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
        logger.info(`received question: ${question}`);

        const result = await ask(question, language, onRender);

        res.json(result);
    } catch (error) {
        logger.error("Ask failed:", error);
        res.status(500).json({ error: "Ask failed" });
    }
});

export default router;