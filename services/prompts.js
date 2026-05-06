import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



class Prompts {
  systemInstruction = fs.readFileSync(path.join(__dirname, "system_instruction.txt"), "utf-8");
  companySystemInstruction = fs.readFileSync(path.join(__dirname, "company_system_instruction.txt"), "utf-8");
  biography = fs.readFileSync(path.join(__dirname, "biography.txt"), "utf-8");

  constructor() {
    // Properties are already initialized inline
  }

  getSystemPrompt(language, ragContext = "") {
    return `
      ${this.systemInstruction}

      Here is retrieved context from Dvir's database:
      <context>
      ${ragContext}
      </context>

      CRITICAL RULE OVERRIDE: If the context above contains an explicit "Answer:" that directly matches the user's explicit question, you MUST output that exact answer word-for-word! This overrides the other critical rules about his introduction.

      If no exact QA match is found in the context, intelligently and concisely answer using the following master context of Dvir's background:

      <biography>
      ${this.biography}
      </biography>

      Your absolute priority is to sound extremely competent, friendly, and knowledgeable about Dvir's work history! Do NOT invent any experience he doesn't have.

      IMPORTANT: Respond in the following language: ${language}.
        `.trim();
  }

  getCompanySystemPrompt(language, ragContext = "") {
    return `
      ${this.companySystemInstruction}

      You are answering a question about a specific company. Use the following retrieved context to answer the question accurately and concisely.

      <context>
      ${ragContext}
      </context>

      Base your answer ONLY on the provided context. If the information is not in the context, clearly state that you don't know based on the available data. Do not invent any facts about the company.

      IMPORTANT: Respond in the following language: ${language}.
    `.trim();
  }

  translationContentPrompt() {
    return "Translate the following user question to English for information retrieval. Only return the translated text."
  }

  classifyQuestionPrompt() {
    return `
      You are an intent classification assistant. 
      Your task is to classify user questions into 'DvirResume' or the name of the company the user asked about.
      - If the question is about Dvir (his background, skills, projects, personality, asking for his help, etc) or a general chat message, output exactly: 'DvirResume'.
      - If the question is asking about a specific company, output ONLY the normalized core name of the company. Do not include the topic they are asking about (e.g., if asking for "Apple's financial data" or "Google CEO", output ONLY "apple" or "google").
      
      CRITICAL RULE FOR COMPANY NAMES: The company name MUST be entirely lowercase, with ALL spaces replaced by underscores. (Example: 'transmit_security', 'google', 'monday_com').
      Output ONLY 'DvirResume' or the formatted company name. Do not add any extra text, explanation, or punctuation.
    `.trim();
  }

  companyResearchPrompt() {
    return `
        You are a data extraction assistant.

        Given a company name, return structured JSON only.

        Rules:
        - Return ONLY valid JSON
        - Do not explain anything
        - Do not add text outside JSON

        Fields:
        {
          "companyName": string,
          "normalizedCompanyName": string,
          "summary": string,
          "industry": string,
          "headquarters": string,
          "management": {
            "founders": string[],
            "CEO": string,
            "CTO": string,
            "CPO": string,
          },
          "products": string[],
          "recentNews": [
            {
              "title": string,
              "date": string,
              "source": string
            }
          ],
          "financeData": {
            "estimatedRevenue": string,
            "totalFunding": string,
            "valuation": string,
            "investors": string[],
            "businessModel": string
          },
          "interviewTalkingPoints": string[],
          "sources": string[]
        }

        Guidelines:
        - normalizedCompanyName should be lowercase, no spaces, simple (e.g. "monday" or "transmit_security")
        - recentNews should include 2-5 recent events if possible
        - interviewTalkingPoints should be useful for job interviews
          `.trim()
  }
}

export default new Prompts();
