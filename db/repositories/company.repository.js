import { pool } from "../client.js";
import { logger } from "../../utils/logger.js";

export async function upsertCompany(company) {
  const query = `
    INSERT INTO companies (
      company_name,
      normalized_company_name,
      summary,
      industry,
      headquarters,
      products,
      recent_news,
      interview_talking_points,
      sources,
      finance_data,
      management,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, NOW())
    ON CONFLICT (normalized_company_name)
    DO UPDATE SET
      company_name = EXCLUDED.company_name,
      summary = EXCLUDED.summary,
      industry = EXCLUDED.industry,
      headquarters = EXCLUDED.headquarters,
      products = EXCLUDED.products,
      recent_news = EXCLUDED.recent_news,
      interview_talking_points = EXCLUDED.interview_talking_points,
      sources = EXCLUDED.sources,
      finance_data = EXCLUDED.finance_data,
      management = EXCLUDED.management,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    company.companyName,
    company.normalized_company_name,
    company.summary,
    company.industry,
    company.headquarters,
    JSON.stringify(company.products || []),
    JSON.stringify(company.recentNews || []),
    JSON.stringify(company.interviewTalkingPoints || []),
    JSON.stringify(company.sources || []),
    JSON.stringify(company.financeData || {}),
    JSON.stringify(company.management || {})
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  catch (error) {
    logger.error("upsertCompany failed:", error);
    return error;
  }
}

export async function getCompanyByName(companyName) {
  const normalized = companyName.toLowerCase().replace(/\s+/g, '');
  const query = `
        SELECT * FROM companies
        WHERE normalized_company_name = $1 OR company_name ILIKE $2
    `;
  const { rows } = await pool.query(query, [normalized, `%${companyName}%`]);
  return rows[0];
}