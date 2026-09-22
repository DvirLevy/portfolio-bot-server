import { z } from "zod";
import { tool } from "@langchain/core/tools";
import mammoth from "mammoth";

/**
 * @description tool that extracts plain text from a .docx file via mammoth.
 * @returns {DynamicStructuredTool}
 */
export const extractDocxTextTool = tool(
    async (_input, runtime) => {
        const { buffer } = runtime.context;

        const { value: text, messages } = await mammoth.extractRawText({ buffer });

        return JSON.stringify({
            text,
            charCount: text.length,
            warnings: messages.filter((m) => m.type === "warning").map((m) => m.message),
        });
    },
    {
        name: "extract_docx_text",
        description: "Extract plain text from a .docx (Word) document.",
        schema: z.object({}),
    }
);
