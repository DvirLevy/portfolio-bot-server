import { createHash } from "node:crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { runAgent } from "../../agents/core/runAgent.js";
import { DOCUMENT_SCAN_AGENT } from "../../agents/yl/documentScan.agent.js";
import { getVectorStore } from "../../utils/vector-store.js";
import { getYlConnectionOptions } from "../../db/ylClient.js";
import * as scannedDocsRepository from "../../db/repositories/scannedDocs.repository.js";
import { logger } from "../../utils/logger.js";

const YL_VECTOR_TABLE = "yl_scanned_docs";

function checksumOf(buffer) {
    return createHash("sha256").update(buffer).digest("hex");
}

/**
 * @description entry point for POST /api/yl/scan. Dedupes by content checksum, creates the scanned_docs row, and kicks off the (fire-and-forget) scan pipeline in the background.
 * @param {object} file
 * @param {Buffer} file.buffer
 * @param {string} file.mimeType
 * @param {string} file.originalFilename
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function startScan({ buffer, mimeType, originalFilename }) {
    const checksum = checksumOf(buffer);

    const existing = await scannedDocsRepository.getScannedDocByChecksum(checksum);
    if (existing) {
        logger.info("Scan already exists for this checksum, skipping re-scan", { id: existing.id, checksum });
        return { id: existing.id, status: existing.status };
    }

    const doc = await scannedDocsRepository.createScannedDoc({
        originalFilename,
        mimeType,
        fileSizeBytes: buffer.length,
        checksum,
    });

    runScanPipeline(doc.id, { buffer, mimeType, originalFilename }).catch((error) => {
        logger.error("Unhandled error escaped runScanPipeline:", error);
    });

    return { id: doc.id, status: doc.status };
}

/**
 * @description entry point for GET /api/yl/scan/:id.
 * @param {string} id - scanned_docs id
 * @returns {Promise<object|undefined>}
 */
export async function getScanStatus(id) {
    return scannedDocsRepository.getScannedDocById(id);
}

async function runScanPipeline(scanId, { buffer, mimeType, originalFilename }) {
    try {
        await scannedDocsRepository.updateScannedDocStatus(scanId, "processing");
        logger.info("Scan status transition", { scanId, from: "pending", to: "processing" });

        const { output, trace } = await runAgent(DOCUMENT_SCAN_AGENT, {
            input: {
                messages: [{ role: "user", content: "Extract all content from the uploaded document." }],
            },
            context: { buffer, mimeType, originalFilename },
            logContext: { scanId, filename: originalFilename },
        });

        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.createDocuments(
            [output.extractedText],
            [{ scanId, title: output.title, docType: output.docType }]
        );

        const vectorStore = await getVectorStore(YL_VECTOR_TABLE, getYlConnectionOptions());
        const embedStart = Date.now();
        await vectorStore.addDocuments(chunks);
        const embedDurationMs = Date.now() - embedStart;

        logger.info("Scan pipeline stages", {
            scanId,
            chunkCount: chunks.length,
            embedDurationMs,
            vectorTable: YL_VECTOR_TABLE,
        });

        await scannedDocsRepository.updateScannedDocStatus(scanId, "completed", {
            doc_type: output.docType,
            language: output.language,
            title: output.title,
            summary: output.summary,
            extracted_text: output.extractedText,
            extracted_data: output.extractedData || {},
            extraction_method: output.extractionMethod,
            agent_trace: trace,
            chunk_count: chunks.length,
            vector_table: YL_VECTOR_TABLE,
        });

        logger.info("Scan status transition", { scanId, from: "processing", to: "completed" });
    } catch (error) {
        logger.error("Scan pipeline failed:", { scanId, error: error.message, stack: error.stack });
        await scannedDocsRepository.updateScannedDocStatus(scanId, "failed", {
            error_message: error.message,
        });
        logger.info("Scan status transition", { scanId, from: "processing", to: "failed" });
        throw error;
    }
}
