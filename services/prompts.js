import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🚀 PERF OPTIMIZATION:
 * We now load all these text files into memory exactly ONCE when the server boots. 
 * By doing this outside the function, we prevent `readFileSync` from freezing 
 * the Node.js event loop every single time a user sends a chat message!
 */
const systemInstruction = fs.readFileSync(path.join(__dirname, "system_instruction.txt"), "utf-8");
const biography = fs.readFileSync(path.join(__dirname, "biography.txt"), "utf-8");

let qaBlueprintHe = "[]";
let qaBlueprintEn = "[]";

try {
    qaBlueprintHe = fs.readFileSync(path.join(__dirname, "qa_blueprint_he.json"), "utf-8");
    qaBlueprintEn = fs.readFileSync(path.join(__dirname, "qa_blueprint_en.json"), "utf-8");
} catch (err) {
    console.error("Failed to load QA blueprints", err);
}

export function getSystemPrompt(language) {
  const isHebrew = language.includes("he");
  const qaBlueprint = isHebrew ? qaBlueprintHe : qaBlueprintEn;

  return `
${systemInstruction}

Predefined Q&A Blueprint:
${qaBlueprint}

If a question falls outside this blueprint, intelligently and concisely answer using the following master context of your (Dvir's) background:
${biography}

Your absolute priority is to sound extremely competent, friendly, and knowledgeable about your own work history! Do NOT invent any experience you don't have.
  `.trim();
}
