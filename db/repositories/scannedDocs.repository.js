import { getYlPool } from "../ylClient.js";
import { logger } from "../../utils/logger.js";

export async function createScannedDoc({ originalFilename, mimeType, fileSizeBytes, checksum }) {
    const query = `
        INSERT INTO scanned_docs (
            original_filename,
            mime_type,
            file_size_bytes,
            checksum,
            status
        )
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *;
    `;

    try {
        const { rows } = await getYlPool().query(query, [originalFilename, mimeType, fileSizeBytes, checksum]);
        return rows[0];
    } catch (error) {
        logger.error("createScannedDoc failed:", error);
        throw error;
    }
}

export async function getScannedDocByChecksum(checksum) {
    const query = `SELECT * FROM scanned_docs WHERE checksum = $1`;

    try {
        const { rows } = await getYlPool().query(query, [checksum]);
        return rows[0];
    } catch (error) {
        logger.error("getScannedDocByChecksum failed:", error);
        throw error;
    }
}

/**
 * @description marks scanned_docs rows stuck in 'processing' (left behind by a pm2 restart mid-scan) as 'failed', so they're visibly retryable instead of stuck forever. Intended to run once at server boot.
 * @param {number} [staleAfterMinutes] - how old a 'processing' row must be to count as stale, default 30
 * @returns {Promise<number>} - number of rows reset
 */
export async function resetStaleProcessingScans(staleAfterMinutes = 30) {
    const query = `
        UPDATE scanned_docs
        SET status = 'failed', error_message = 'Interrupted by server restart', updated_at = NOW()
        WHERE status = 'processing' AND updated_at < NOW() - ($1 || ' minutes')::interval
        RETURNING id;
    `;

    try {
        const { rows } = await getYlPool().query(query, [staleAfterMinutes]);
        return rows.length;
    } catch (error) {
        logger.error("resetStaleProcessingScans failed:", error);
        throw error;
    }
}

export async function getScannedDocById(id) {
    const query = `SELECT * FROM scanned_docs WHERE id = $1`;

    try {
        const { rows } = await getYlPool().query(query, [id]);
        return rows[0];
    } catch (error) {
        logger.error("getScannedDocById failed:", error);
        throw error;
    }
}

const JSONB_COLUMNS = new Set(["extracted_data", "agent_trace"]);
const UPDATABLE_COLUMNS = new Set([
    "doc_type", "language", "title", "summary", "extracted_text",
    "extracted_data", "extraction_method", "agent_trace",
    "chunk_count", "vector_table", "error_message",
]);

export async function updateScannedDocStatus(id, status, fields = {}) {
    const setClauses = ["status = $2", "updated_at = NOW()"];
    const values = [id, status];

    for (const [column, value] of Object.entries(fields)) {
        if (!UPDATABLE_COLUMNS.has(column)) {
            throw new Error(`updateScannedDocStatus: unknown column "${column}"`);
        }
        values.push(JSONB_COLUMNS.has(column) ? JSON.stringify(value) : value);
        setClauses.push(`${column} = $${values.length}${JSONB_COLUMNS.has(column) ? "::jsonb" : ""}`);
    }

    const query = `
        UPDATE scanned_docs
        SET ${setClauses.join(", ")}
        WHERE id = $1
        RETURNING *;
    `;

    try {
        const { rows } = await getYlPool().query(query, values);
        return rows[0];
    } catch (error) {
        logger.error("updateScannedDocStatus failed:", error);
        throw error;
    }
}
