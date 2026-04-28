import { logger } from "../../../utils/logger.js";
import OpenAI from "../../../utils/openAI.js";
import prompts from "../../prompts.js";

/** 
 * @description classify question to 'DvirResume' or for the company name provided. fallback on error to 'DvirResume'
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function classifyQuestion(question) {
    const openAI = new OpenAI(0).model
    try {
        // const lowerQuestion = question.toLocaleLowerCase();
        // if (lowerQuestion.startsWith("company:?")) {
        //     return 'Company';
        // }
        // else if (lowerQuestion.startsWith("dvir:?")) {
        //     return 'DvirResume';
        // }
        // else {
        const classificationPrompt = prompts.classifyQuestionPrompt()

        const response = await openAI.invoke([
            { role: "system", content: classificationPrompt },
            { role: "user", content: question }
        ]);

        const classification = response.content.trim();

        if (classification.toLowerCase().includes('dvirresume') || classification.toLowerCase() === 'dvir') {
            return 'DvirResume'
        }
        else {
            return classification
        }
    }
    catch (error) {
        logger.error("classifyQuestion failed:", error);
        return 'DvirResume' // Fallback my resume
    }
}