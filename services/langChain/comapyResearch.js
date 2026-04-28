import OpenAI from "../../utils/openAI.js";
import prompts from "../prompts.js";

/**
 * @description asks for company data using OpenAI
 * @param {string} companyName - The name of the company
 * @returns {Promise<object>} - The company data
 */
export async function companyResearch(companyName) {
    const openAI = new OpenAI(0).model;

    const response = await openAI.invoke([
        {
            role: "system",
            content: prompts.companyResearchPrompt(),
        },
        {
            role: "user",
            content: `Company: ${companyName}`,
        },
    ]);

    try {
        const textResponse = response.content;
        
        // Ensure OpenAI didn't wrap the JSON in markdown code blocks
        const cleanedResponse = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
        
        return JSON.parse(cleanedResponse);
    } catch (err) {
        throw new Error("Failed to parse OpenAI response: " + response.content);
    }
}