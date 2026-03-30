import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoute from "./Router/apiIndexRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import { limiter } from "./services/rateLimiter.js";
import { logger } from "./services/logger.js";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config();

const app = express();
app.set("trust proxy", 1);
// HTTP request logging
app.use(morgan("tiny", {
  stream: { write: (message) => logger.info(message.trim()) }
}));

const environment = process.env.NODE_ENV || 'development'
const envFile = `.env.${environment}`;
logger.info(`Loading environment from ${envFile}`)
dotenv.config({ path: path.resolve(__dirname, envFile) });



const PORT = process.env.PORT


// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the widget.html and dvir.png so the iframe can load them securely from the same port!
app.use(express.static(__dirname));

app.use("/api", apiRoute);

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "widget.html"));
// });

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
