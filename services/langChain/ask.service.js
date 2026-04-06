import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../utils/vector-store.js";
import { getSystemPrompt } from "../prompts.js";

export async function ask(question, language = "en-US") {
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever(4);

    const relevantDocs = await retriever.invoke(question);

    const context = relevantDocs.map((doc, index) => {
        return `
        Source ${index + 1}:
        Content:${doc.pageContent}`;
    }).join("\n\n");

    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await model.invoke([
        {
            role: "system",
            content: getSystemPrompt(language, context),
        },
        {
            role: "user",
            content: question,
        },
    ]);

    return {
        reply: response.content,
        sources: relevantDocs,
    };
}