import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../utils/vector-store.js";

export async function ask(question) {
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever(4);

    const relevantDocs = await retriever.invoke(question);

    // const context = relevantDocs.map((doc, index) => {
    //     return `Chunk ${index + 1}:\n${doc.pageContent}`;
    // }).join("\n\n");

    const context = relevantDocs.map((doc, index) => {
        return `
        Source ${index + 1}:
        documentId: ${doc.metadata?.documentId || "unknown"}
        role: ${doc.metadata?.role || "unknown"}
        source: ${doc.metadata?.source || "unknown"}
        startDate: ${doc.metadata?.startDate || "unknown"}
        endDate: ${doc.metadata?.endDate || "unknown"}

        Content:${doc.pageContent}`;
    }).join("\n\n");

    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await model.invoke([
        {
            role: "system",
            content: "Answer only from the provided context. If the answer is not in the context, say you don't know.",
        },
        {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
    ]);

    return {
        reply: response.content,
        sources: relevantDocs,
    };
}