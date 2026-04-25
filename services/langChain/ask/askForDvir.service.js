import OpenAI from "../../../utils/openAI.js";
import prompts from "../../prompts.js";


/**
 * @description invokes to openAI the user question on Dvir's resume
 * @param {string} question - The question to ask
 * @param {string} language - The language of the question default to "en-US"
 * @param {object} retriever - The retriever to use default to 4
 * @returns {Promise<object>} - The response
 */
export async function askForDvirResume(question, language = "en-US", retriever) {
    const openAI = new OpenAI(0).model;

    let relevantDocs = []
    let response = {}
    //translate the question before invoke
    if (!language.startsWith("en")) {
        const translationResponse = await openAI.invoke([
            {
                role: "system",
                content: prompts.translationContentPrompt()
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


    response = await openAI.invoke([
        {
            role: "system",
            content: prompts.getSystemPrompt(language, context),
        },
        {
            role: "user",
            content: question,
        },
    ]);


    return {
        reply: response.content,
        language: language,
        sources: relevantDocs,
    };
}


