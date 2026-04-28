export function buildCompanyChunks(company) {
    const chunks = [];

    chunks.push({
        content: `Company: ${company.company_name}
        Summary: ${company.summary || ""}
        Industry: ${company.industry || ""}
        Headquarters: ${company.headquarters || ""}`,
        metadata: {
            entityType: "company",
            companyId: company.id,
            companyName: company.company_name,
            normalizedCompanyName: company.normalized_company_name,
            section: "overview",
            documentId: `company-${company.normalized_company_name}`
        }
    });

    if (Array.isArray(company.products) && company.products.length > 0) {
        chunks.push({
            content: `Products:\n${company.products.join("\n")}`,
            metadata: {
                entityType: "company",
                companyId: company.id,
                companyName: company.company_name,
                normalizedCompanyName: company.normalized_company_name,
                section: "products",
                documentId: `company-${company.normalized_company_name}`
            }
        });
    }

    if (company.finance_data && Object.keys(company.finance_data).length > 0) {
        const f = company.finance_data;
        let finStr = "Financial Overview & Business Model:\n";
        if (f.estimatedRevenue) finStr += `Estimated Revenue: ${f.estimatedRevenue}\n`;
        if (f.totalFunding) finStr += `Total Funding: ${f.totalFunding}\n`;
        if (f.valuation) finStr += `Valuation: ${f.valuation}\n`;
        if (f.businessModel) finStr += `Business Model: ${f.businessModel}\n`;
        if (Array.isArray(f.investors) && f.investors.length > 0) finStr += `Investors: ${f.investors.join(", ")}\n`;
        else if (typeof f.investors === "string") finStr += `Investors: ${f.investors}\n`;

        chunks.push({
            content: finStr.trim(),
            metadata: {
                entityType: "company",
                companyId: company.id,
                companyName: company.company_name,
                normalizedCompanyName: company.normalized_company_name,
                section: "finance",
                documentId: `company-${company.normalized_company_name}`
            }
        });
    }

    return chunks;
}