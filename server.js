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
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms - \x1b[33m":user-agent"\x1b[0m', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

const environment = process.env.NODE_ENV || 'development'
const envFile = `.env.${environment}`;
logger.info(`Loading environment from ${envFile}`)
dotenv.config({ path: path.resolve(__dirname, envFile) });

///for deployement


const PORT = process.env.PORT


app.use(limiter);

app.use(cors({ origin: ["https://dvir-levy.netlify.app", "http://localhost:8080"], }));
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
