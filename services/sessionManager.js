import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '../logs/last_session.json');

/**
 * Gets the list of saved sessions.
 */
export function getRecentSessions() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, 'utf8');
            const parsed = JSON.parse(data);
            logger.info("recent sessions file:", parsed);
            return Array.isArray(parsed) ? parsed : [parsed];
        }
    } catch (error) {
        logger.warn("Could not read sessions file:", error.message);
    }
    return [];
}

/**
 * Saves a new session to the list of recent sessions.
 */
export function saveLastSession(stream_id, session_id) {
    try {
        const sessions = getRecentSessions();
        // Keep only top 10 unique sessions
        const newSessions = [{ stream_id, session_id }, ...sessions]
            .filter((s, index, self) =>
                index === self.findIndex((t) => t.stream_id === s.stream_id)
            )
            .slice(0, 10);

        const data = JSON.stringify(newSessions, null, 2);
        const dir = path.dirname(SESSION_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SESSION_FILE, data);
        logger.info("Saving new sessions file: ", { newSessions, session_id });
    } catch (error) {
        logger.error("Failed to save last session:", error.message);
    }
}

/**
 * Clears the session list.
 */
export function clearLastSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            logger.info("cleared sessions file ", { SESSION_FILE });
            fs.writeFileSync(SESSION_FILE, '[]');
        }
    } catch (error) {
        logger.error("Failed to clear sessions:", error.message);
    }
}
