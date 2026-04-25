import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../utils/vector-store.js";
import { logger } from "../../utils/logger.js";

import * as companyRepository from "../../db/repositories/company.repository.js";
import { buildCompanyChunks } from "./companyChunk.service.js";
import { companyResearch } from "./comapyResearch.js";

export async function ingestCompany({ companyName }) {
    // 0. Check if company already exists
    const existingCompany = await companyRepository.getCompanyByName(companyName);
    if (existingCompany) {
        logger.info("Company already exists in the database, skipping research", { companyName });
        return {
            companyName: existingCompany.company_name,
            message: "Company already exists. Skipping research."
        };
    }
    else {

        // 1. Fetch structured company data using OpenAI
        const companyData = await companyResearch(companyName);
        companyData.normalized_company_name = companyName
        logger.info("Company data fetched successfully", companyData);

        // 2. Save raw structured data into "companies" table
        const savedCompany = await companyRepository.upsertCompany(companyData);
        if (savedCompany instanceof Error) {
            throw savedCompany; // Throw real DB error to prevent undefined property crashes
        }
        logger.info("Company data saved successfully", savedCompany);

        // 3. Convert structured company data into chunks (manual chunking)
        const chunks = buildCompanyChunks(savedCompany);
        logger.info("Company chunks built successfully", chunks);

        // 4. Convert chunks into LangChain Documents
        const docs = chunks.map((chunk) => {
            return new Document({
                pageContent: chunk.content.toLowerCase(), // normalize text
                metadata: chunk.metadata, // includes entityType = "company"
            });
        });
        logger.info("Company documents built successfully", docs);

        // 5. Store documents in vector DB (pgvector via LangChain)
        const vectorStore = await getVectorStore(savedCompany.normalized_company_name);
        await vectorStore.addDocuments(docs);

        logger.info("Company ingested successfully", {
            companyName: savedCompany.company_name,
            chunkCount: docs.length,
        });

        return {
            companyName: savedCompany.company_name,
            chunkCount: docs.length,
        };
    }

}