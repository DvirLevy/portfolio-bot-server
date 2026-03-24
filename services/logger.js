import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} ${level}: ${stack || message}`;
    
    // Append metadata if present (excluding Winston internals)
    const metaEntries = Object.entries(metadata).filter(([key]) => !['service'].includes(key));
    if (metaEntries.length > 0) {
      msg += `\nMetadata: ${JSON.stringify(Object.fromEntries(metaEntries), null, 2)}`;
    }
    
    return msg;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "portfolio-bot-server" },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/error.log"), 
      level: "error" 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/combined.log") 
    }),
  ],
});

// If we're not in production then log to the `console` with colored format
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}
