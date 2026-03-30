import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "../../utils/vector-store.js";
import { logger } from "../logger.js";

export async function ingest({ text, documentId, metadata = {} }) {
    text = text.toLowerCase();
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 50,
    });

    const docs = await splitter.createDocuments(
        [text],
        [{ documentId, ...metadata }]
    );

    const vectorStore = await getVectorStore();
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