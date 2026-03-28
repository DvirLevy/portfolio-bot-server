CREATE TABLE IF NOT EXISTS chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_chunks_document_chunk UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id
ON chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_chunks_created_at
ON chunks (created_at);

CREATE INDEX IF NOT EXISTS idx_chunks_metadata
ON chunks
USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_cosine
ON chunks
USING hnsw (embedding vector_cosine_ops);