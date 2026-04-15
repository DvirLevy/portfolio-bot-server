import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../utils/vector-store.js";
import { getSystemPrompt } from "../prompts.js";
import { logger } from "../logger.js";

export async function ask(question, language = "en-US", onRender = false) {
    let response = {}
    let relevantDocs = [];
    logger.debug(onRender)
    if (onRender) {
        response.content = `היי, אני העוזר AI של דביר
                דביר הוא מהנדס בינה מלאכותית, מתמחה ב-LLM, מערכות Rag,  וארכיטקטורות AI סקלביליות.
                דביר בונה מערכות בינה מלאכותית מקצה לקצה. תראו אותי! אני הפרוייקט הכי מתקדם שלו,
                אני תוצר פיתוח של מערכת שלמה מבוססת Rag,
                עם תשתיות ענן, מאגר מידע ווקטורי פוסטגרס, docker, AWS, EC2, Nginx 
                אתם יכולים לשאול אותי כל דבר עליו`
        relevantDocs = null
    }
    else {
        const vectorStore = await getVectorStore();
        const retriever = vectorStore.asRetriever(4);

        relevantDocs = await retriever.invoke(question);

        const context = relevantDocs.map((doc, index) => {
            return `
            Source ${index + 1}:
            Content:${doc.pageContent}`;
        }).join("\n\n");

        const model = new ChatOpenAI({
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
        });

        response = await model.invoke([
            {
                role: "system",
                content: getSystemPrompt(language, context),
            },
            {
                role: "user",
                content: question,
            },
        ]);
    }

    return {
        reply: response.content,
        sources: relevantDocs,
    };
}