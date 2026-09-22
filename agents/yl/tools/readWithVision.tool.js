import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { PDFParse } from "pdf-parse";
import OpenAI from "../../../utils/openAI.js";
import { logger } from "../../../utils/logger.js";

// Vision OCR costs real money per page — cap how many pages a single scan will pay for.
const MAX_VISION_PAGES = 15;

const TRANSCRIBE_PROMPT =
    "Transcribe every word of visible text on this page image, exactly as it appears, " +
    "preserving reading order. Output only the transcribed text — no commentary, no markdown fences.";

/**
 * @description tool that OCRs a scanned/image-only PDF by rendering each page to an image and asking a vision-capable model to transcribe it. Use only when inspect_document/extract_pdf_text found no usable text layer — this is the expensive fallback path, capped at MAX_VISION_PAGES pages.
 * @returns {DynamicStructuredTool}
 */
export const readWithVisionTool = tool(
    async (_input, runtime) => {
        const { buffer } = runtime.context;
        const model = new OpenAI(0).model;

        const parser = new PDFParse({ data: buffer });
        let screenshots;
        try {
            screenshots = await parser.getScreenshot({ first: MAX_VISION_PAGES });
        } finally {
            await parser.destroy();
        }

        const pageTexts = [];
        for (const page of screenshots.pages) {
            const response = await model.invoke([
                new HumanMessage({
                    content: [
                        { type: "text", text: TRANSCRIBE_PROMPT },
                        { type: "image_url", image_url: { url: page.dataUrl } },
                    ],
                }),
            ]);
            pageTexts.push(response.content);
            logger.debug(`read_with_vision transcribed page ${page.pageNumber}/${screenshots.total}`);
        }

        const text = pageTexts.join("\n\n");

        return JSON.stringify({
            pageCount: screenshots.total,
            pagesProcessed: screenshots.pages.length,
            truncated: screenshots.total > MAX_VISION_PAGES,
            text,
            charCount: text.length,
        });
    },
    {
        name: "read_with_vision",
        description:
            `OCR a scanned/image-only PDF via a vision model, page by page (capped at ${MAX_VISION_PAGES} pages). ` +
            "Expensive — only call this after extract_pdf_text has been tried and returned empty or near-empty text.",
        schema: z.object({}),
    }
);
