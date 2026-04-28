import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoute from "./Router/apiIndexRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import { limiter } from "./services/rateLimiter.js";
import { logger } from "./utils/logger.js";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(morgan("tiny", {
  stream: { write: (message) => logger.info(message.trim()) }
}));

const environment = process.env.NODE_ENV || 'development'
const envFile = `.env.${environment}`;
logger.info(`Loading environment from ${envFile}`)
dotenv.config({ path: path.resolve(__dirname, envFile) });



const PORT = process.env.PORT


app.use(limiter);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

app.use("/api", apiRoute);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
