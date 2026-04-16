import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../utils/vector-store.js";
import { getSystemPrompt } from "../prompts.js";


export async function ask(question, language = "en-US", onRender = false) {
    let response = {}
    let relevantDocs = []
    // onRender = false
    if (onRender) {
        response.content = "היי, אני העוזר AI של דביר. דביר הוא מהנדס בינה מלאכותית, עם שלוש שנות ניסיון כמפתח תוכנה, מתמחה ב-LLM, מערכות Rag, וארכיטקטורות AI סקלביליות. דביר בונה מערכות בינה מלאכותית מקצה לקצה. תראו אותי! אני הפרוייקט הכי מתקדם שלו, אני תוצר פיתוח של מערכת שלמה מבוססת Rag, עם תשתיות ענן, מאגר מידע ווקטורי פוסטגרס, docker, AWS, EC2, N-ginx. אתם יכולים לשאול אותי כל דבר עליו."
        relevantDocs = ["overrided"]
        language = 'he-IL'
    }

    else {
        const model = new ChatOpenAI({
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
        });
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
        language: language,
        sources: relevantDocs,
    };
}

