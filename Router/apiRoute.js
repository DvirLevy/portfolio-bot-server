import express from "express";
import * as botBL from "../BL/botBL.js";
import { logger } from "../services/logger.js";

const apiRoute = express.Router();

apiRoute.post("/did/create-stream", async (req, res) => {
  try {
    const data = await botBL.createStream(req.body.source_url);
    res.json(data);
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

apiRoute.post("/did/start-stream/:stream_id", async (req, res) => {
  try {
    const data = await botBL.startStream(req.params.stream_id, req.body.answer, req.body.session_id);
    res.json(data);
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

apiRoute.post("/did/ice/:stream_id", async (req, res) => {
  try {
    const data = await botBL.submitIceCandidate(req.params.stream_id, req.body);
    res.json(data);
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

apiRoute.post("/did/talk/:stream_id", async (req, res) => {
  try {
    const data = await botBL.talkToStream(req.params.stream_id, req.body);
    res.json(data);
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

apiRoute.delete("/did/stream/:stream_id", async (req, res) => {
  try {
    const data = await botBL.deleteStream(req.params.stream_id, req.body);
    res.json(data);
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

apiRoute.post("/chat", async (req, res) => {
  try {
    const reply = await botBL.getChatReply(req.body.message, req.body.language);
    res.json({ reply });
  } catch (error) {
    logger.error(error.message, { stack: error.stack, originalError: error.response });
    res.status(500).json({ 
      detail: error.message,
      originalError: error.response 
    });
  }
});

export default apiRoute;
