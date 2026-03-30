import express from "express";
import { ingest } from "../services/langChain/ingest.service.js";
import { ask } from "../services/langChain/ask.service.js";

const router = express.Router();

router.post("/ingest", async (req, res) => {
    try {
        const { text, documentId, metadata } = req.body;

        const result = await ingest({ text, documentId, metadata });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ingest failed" });
    }
});

router.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;

        const result = await ask(question);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ask failed" });
    }
});

export default router;