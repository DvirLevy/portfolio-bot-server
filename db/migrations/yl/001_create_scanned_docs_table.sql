CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS scanned_docs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename text NOT NULL,
    mime_type         text NOT NULL,
    file_size_bytes   integer NOT NULL,
    checksum          text NOT NULL UNIQUE,
    status            text NOT NULL DEFAULT 'pending',
    doc_type          text,
    language          text,
    title             text,
    summary           text,
    extracted_text    text,
    extracted_data    jsonb DEFAULT '{}'::jsonb,
    extraction_method text,
    agent_trace       jsonb DEFAULT '[]'::jsonb,
    chunk_count       integer DEFAULT 0,
    vector_table      text,
    error_message     text,
    created_at        timestamptz DEFAULT now(),
    updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scanned_docs_status   ON scanned_docs (status);
CREATE INDEX IF NOT EXISTS idx_scanned_docs_checksum ON scanned_docs (checksum);
