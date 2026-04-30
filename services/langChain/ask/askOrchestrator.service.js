import { getVectorStore } from "../../../utils/vector-store.js";
import { classifyQuestion } from "./classifyQuestion.service.js";
import { askForDvirResume } from "./askForDvir.service.js";
import { askForCompany } from "./askForCompany.service.js";
import { logger } from "../../../utils/logger.js";


/**
 * @description orchestrates the RAG pipeline
 * @param {string} question - The question to ask
 * @param {string} language - The language of the question default to "en-US"
 * @param {boolean} onRender - Whether the question is for the render page default to false
 * @returns {Promise<object>} - response the RAG pipeline answer
 */
export async function askOrchestrator(question, language = "en-US", onRender = false) {

    if (onRender) {
        const TIMEOUT = 3000
        return new Promise((resolve, reject) => {
            logger.info(`onRender timeout ${TIMEOUT}ms`);
            setTimeout(() => {
                resolve({
                    reply: "Hi, I'm Dvir's AI assistant. His most advanced AI project. Dvir is an AI software engineer specializing in LLM, Rag systems, and scalable AI architectures. He builds AI systems end-to-end, from retrieval pipelines and vector databases to backend services and cloud infrastructure. Dvir designed and developed a full Rag-based system. Look at me, I'm powered by a vector database, running on AWS with EC2, Docker, Postgres, and Nginx. Dvir combines strong backend engineering with AI expertise to deliver production-ready solutions. Ask me anything to explore what he can build.",
                    // reply: "היי, אני העוזר AI של דביר. דביר הוא מהנדס בינה מלאכותית, עם שלוש שנות ניסיון כמפתח תוכנה, מתמחה ב-LLM, מערכות Rag, וארכיטקטורות AI סקלביליות. דביר בונה מערכות בינה מלאכותית מקצה לקצה. תראו אותי! אני הפרוייקט הכי מתקדם שלו, אני תוצר פיתוח של מערכת שלמה מבוססת Rag, עם תשתיות ענן, מאגר מידע ווקטורי פוסטגרס, docker, AWS, EC2, N-ginx. אתם יכולים לשאול אותי כל דבר עליו.",
                    relevantDocs: ["overrided"],
                    language: 'en-US'
                });
            }, TIMEOUT);
        });
    }

    else {
        const classification = await classifyQuestion(question);
        const vectorStore = await getVectorStore(classification);
        const retriever = vectorStore.asRetriever(4);

        if (classification === "DvirResume") {
            return await askForDvirResume(question, language, retriever);
        }
        else {
            return await askForCompany(classification, question, language, retriever);
        }
    }

}

