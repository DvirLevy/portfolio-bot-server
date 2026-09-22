import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { PDFParse } from "pdf-parse";

// Below this many extracted characters across the whole document, treat a PDF as
// having no usable text layer (i.e. it's a scan) rather than trust a near-empty result.
const MIN_CHARS_FOR_TEXT_LAYER = 20;

/**
 * @description tool that reports basic facts about the uploaded document (mime type, size, page count, whether a PDF has an extractable text layer) so the agent can decide which extraction tool to use next. Operates on the file bound to the run via runtime.context — it takes no model-supplied arguments.
 * @returns {DynamicStructuredTool}
 */
export const inspectDocumentTool = tool(
    async (_input, runtime) => {
        const { buffer, mimeType, originalFilename } = runtime.context;

        const info = {
            filename: originalFilename,
            mimeType,
            sizeBytes: buffer.length,
            pageCount: null,
            likelyHasTextLayer: null,
        };

        if (mimeType === "application/pdf") {
            const parser = new PDFParse({ data: buffer });
            try {
                const textResult = await parser.getText();
                info.pageCount = textResult.total;
                const totalChars = textResult.pages.reduce((sum, page) => sum + page.text.trim().length, 0);
                info.likelyHasTextLayer = totalChars >= MIN_CHARS_FOR_TEXT_LAYER;
            } finally {
                await parser.destroy();
            }
        }

        return JSON.stringify(info);
    },
    {
        name: "inspect_document",
        description:
            "Inspect the uploaded document and return its mime type, size, page count, and whether it likely has an extractable text layer (vs. being a scanned image with no real text). Call this first, before choosing an extraction tool.",
        schema: z.object({}),
    }
);
