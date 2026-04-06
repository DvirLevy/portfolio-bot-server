import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read once on boot
const systemInstruction = fs.readFileSync(path.join(__dirname, "system_instruction.txt"), "utf-8");
const biography = fs.readFileSync(path.join(__dirname, "biography.txt"), "utf-8");

export function getSystemPrompt(language, ragContext = "") {
  return `
${systemInstruction}

Here is retrieved context from Dvir's database:
<context>
${ragContext}
</context>

If the context above doesn't have the answer, intelligently and concisely answer using the following master context of Dvir's background:

<biography>
${biography}
</biography>

Your absolute priority is to sound extremely competent, friendly, and knowledgeable about Dvir's work history! Do NOT invent any experience he doesn't have.
  `.trim();
}
