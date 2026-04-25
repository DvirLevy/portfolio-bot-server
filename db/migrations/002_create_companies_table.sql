CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    company_name text NOT NULL,
    normalized_company_name text NOT NULL UNIQUE,
    summary text,
    industry text,
    headquarters text,
    products jsonb DEFAULT '[]'::jsonb,
    recent_news jsonb DEFAULT '[]'::jsonb,
    interview_talking_points jsonb DEFAULT '[]'::jsonb,
    sources jsonb DEFAULT '[]'::jsonb,
    finance_data jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    management jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON companies (normalized_company_name);