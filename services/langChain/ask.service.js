import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../utils/vector-store.js";
import { getSystemPrompt } from "../prompts.js";

export async function ask(question, language = "en-US") {
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
    });
    let relevantDocs = []
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever(4);
    //translate the question before invoke
    if (!language.startsWith("en")) {
        const translationResponse = await model.invoke([
            {
                role: "system",
                content: "Translate the following user question to English for information retrieval. Only return the translated text.",
            },
            {
                role: "user",
                content: question,
            },
        ])
        relevantDocs = await retriever.invoke(translationResponse.content)
    }
    else {
        relevantDocs = await retriever.invoke(question);
    }


    const context = relevantDocs.map((doc, index) => {
        return `
        Source ${index + 1}:
        Content:${doc.pageContent}`;
    }).join("\n\n");


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