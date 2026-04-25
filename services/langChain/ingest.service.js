import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "../../utils/vector-store.js";
import { logger } from "../../utils/logger.js";

export async function ingest({ text, documentId, metadata = {} }) {
    text = text.toLowerCase();
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments(
        [text],
        [{ documentId, ...metadata }]
    );

    const vectorStore = await getVectorStore("DvirResume");
    await vectorStore.addDocuments(docs);

    logger.info("Document ingested successfully", {
        documentId,
        chunkCount: docs.length,
    });

    return {
        documentId,
        chunkCount: docs.length,
    };
}