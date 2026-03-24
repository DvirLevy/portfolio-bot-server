import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '../logs/last_session.json');

/**
 * Gets the last saved session info.
 */
export function getLastSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        logger.warn("Could not read last session file:", error.message);
    }
    return null;
}

/**
 * Saves the current session info as the 'last' session.
 */
export function saveLastSession(stream_id, session_id) {
    try {
        const data = JSON.stringify({ stream_id, session_id }, null, 2);
        const dir = path.dirname(SESSION_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SESSION_FILE, data);
    } catch (error) {
        logger.error("Failed to save last session:", error.message);
    }
}

/**
 * Clears the last session info.
 */
export function clearLastSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            fs.unlinkSync(SESSION_FILE);
        }
    } catch (error) {
        logger.error("Failed to clear last session:", error.message);
    }
}
