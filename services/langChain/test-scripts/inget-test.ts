import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { ingest } from "../ingest.service.js";

const text = `
RAG systems combine retrieval and generation.
They allow LLMs to access external knowledge.
This improves accuracy and reduces hallucinations.
LangChain simplifies building RAG pipelines.
`;

await ingest({
    text,
    documentId: "rag-intro-langchain",
    metadata: {
        source: "manual-test",
        title: "LangChain Intro",
    },
});