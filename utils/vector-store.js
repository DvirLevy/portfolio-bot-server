import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @description gets/creates a pgvector-backed LangChain vector store for a given table.
 * @param {string} tableName - the pgvector table name (also the LangChain "collection")
 * @param {object} [connectionOptions] - overrides the default RAG DB connection (e.g. to point at yl_db); read lazily at call time, not module load time
 * @returns {Promise<PGVectorStore>}
 */
export async function getVectorStore(tableName, connectionOptions) {
    return await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: connectionOptions || {
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT || 5432),
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "postgres",
            database: process.env.DB_NAME || "rag_db",
        },
        tableName: tableName,
        columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
        },
    });
}