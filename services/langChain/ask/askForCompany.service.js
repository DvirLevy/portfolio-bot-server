import OpenAI from "../../../utils/openAI.js";
import prompts from "../../prompts.js";
import { ingestCompany } from "../ingestCompany.service.js";
import { logger } from "../../../utils/logger.js";

/**
 * @description asks for company data using OpenAI
 * @param {string} companyName - The name of the company
 * @returns {Promise<object>} - The company data
 */
export async function askForCompany(companyName, question, language, retriever) {
    const openAI = new OpenAI(0).model;
    const ingestData = await ingestCompany({ companyName });
    logger.info("ingest data: ", ingestData);
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
            content: prompts.getCompanySystemPrompt(language, context),
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