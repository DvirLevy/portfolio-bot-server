import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { PDFParse } from "pdf-parse";

/**
 * @description tool that extracts the real text layer of a PDF via pdf-parse. Use only when inspect_document reported likelyHasTextLayer=true — on a scanned PDF this returns empty/near-empty text, which the agent should treat as a signal to fall back to read_with_vision.
 * @returns {DynamicStructuredTool}
 */
export const extractPdfTextTool = tool(
    async (_input, runtime) => {
        const { buffer } = runtime.context;

        const parser = new PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            // Build the text ourselves from result.pages rather than using result.text,
            // which interleaves "-- N of M --" page-separator artifacts into the string.
            const text = result.pages.map((page) => page.text).join("\n\n");
            return JSON.stringify({
                pageCount: result.total,
                text,
                charCount: text.length,
            });
        } finally {
            await parser.destroy();
        }
    },
    {
        name: "extract_pdf_text",
        description:
            "Extract the plain-text layer of a PDF. Only useful when the document has a real text layer (see inspect_document) — returns near-empty text for scanned/image-only PDFs.",
        schema: z.object({}),
    }
);
