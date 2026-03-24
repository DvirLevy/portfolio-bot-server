import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../logs/image_cache.json');

let cache = {};

// Load cache from file if it exists
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    cache = JSON.parse(data);
    logger.info("Image cache loaded from file.");
  }
} catch (error) {
  logger.warn("Could not load image cache:", error.message);
}

/**
 * Gets a cached D-ID URL for a given local file path or identifier.
 */
export function getCachedUrl(key) {
  return cache[key];
}

/**
 * Sets a cached D-ID URL and persists it to disk.
 */
export function setCachedUrl(key, url) {
  cache[key] = url;
  try {
    // Ensure logs directory exists
    const logDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    logger.error("Failed to save image cache:", error);
  }
}
