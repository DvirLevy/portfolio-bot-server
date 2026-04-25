import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../utils/vector-store.js";
import { logger } from "../../utils/logger.js";

export async function ingestQA(qnaData) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const texts = qnaData.map(qna => qna.text);
    const metadatas = qnaData.map(qna => ({ documentId: qna.documentId, ...qna.metadata }));

    const docs = await splitter.createDocuments(texts, metadatas);

    const vectorStore = await getVectorStore("DvirResume");
    await vectorStore.addDocuments(docs);

    logger.info("Documents ingested successfully", {
        chunkCount: docs.length,
    });

    return {
        // documentId,
        chunkCount: docs.length,
    };
}