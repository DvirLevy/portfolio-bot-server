import { z } from "zod";
import { createDomainAgent } from "../core/createDomainAgent.js";
import { registerAgent } from "../core/agentRegistry.js";
import { inspectDocumentTool } from "./tools/inspectDocument.tool.js";
import { extractPdfTextTool } from "./tools/extractPdfText.tool.js";
import { extractDocxTextTool } from "./tools/extractDocxText.tool.js";
import { readWithVisionTool } from "./tools/readWithVision.tool.js";

export const DOCUMENT_SCAN_AGENT = "documentScan";

const SYSTEM_PROMPT = `You are a document-scanning agent. You are given one uploaded document (PDF or DOCX)
and must extract ALL of its textual content, verbatim — not a summary, not an excerpt. The full text you
return will be chunked and embedded for retrieval, so leaving content out or truncating it is a failure.

Work like this:
1. Always call inspect_document first to learn the mime type, page count, and whether a PDF likely has a
   real text layer.
2. If the document is a .docx, call extract_docx_text.
3. If the document is a PDF with a text layer, call extract_pdf_text. If the result comes back empty or
   clearly garbled/near-empty relative to the page count, that PDF is actually a scan — fall back to
   read_with_vision instead of accepting the empty result.
4. If the document is a PDF with no text layer (or extract_pdf_text failed to produce real text), call
   read_with_vision to OCR it.
5. Never call a tool more than once with the same purpose unless the previous attempt clearly failed —
   don't loop needlessly.

Once you have the full extracted text, respond with the structured output: doc_type, language, title,
summary, the complete extractedText, which extractionMethod actually produced it, and any extractedData
worth capturing separately (key fields, dates, amounts, parties — as a flat object). extractedText must be
the full text, not a shortened version of it.`;

export const documentScanResponseSchema = z.object({
    docType: z.string().describe("A short label for the kind of document, e.g. invoice, contract, resume, report, letter"),
    language: z.string().describe("ISO 639-1 code of the document's primary language, e.g. 'en', 'he'"),
    title: z.string().describe("The document's title, or a concise title inferred from its content if none is present"),
    summary: z.string().describe("A 2-4 sentence summary of the document's content"),
    extractedText: z.string().describe("The complete extracted text of the document, verbatim, in full — never truncated or summarized"),
    extractionMethod: z.enum(["text_layer", "vision_ocr", "docx"]).describe("Which tool actually produced extractedText"),
    extractedData: z.record(z.string(), z.any()).optional().describe("Additional structured fields worth capturing beyond plain text, as a flat key-value object"),
});

registerAgent(DOCUMENT_SCAN_AGENT, () =>
    createDomainAgent({
        name: DOCUMENT_SCAN_AGENT,
        systemPrompt: SYSTEM_PROMPT,
        tools: [inspectDocumentTool, extractPdfTextTool, extractDocxTextTool, readWithVisionTool],
        responseFormat: documentScanResponseSchema,
        maxIterations: 8,
    })
);
