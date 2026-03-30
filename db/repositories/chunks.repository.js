import pool from '../client.js';

class ChunksRepository {
    async insertChunk({ documentId, chunkIndex, content, metadata, embedding }) {
        const query = `
      INSERT INTO chunks (
        document_id,
        chunk_index,
        content,
        metadata,
        embedding
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [
            documentId,
            chunkIndex,
            content,
            metadata || {},
            embedding,
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async getChunksByDocumentId(documentId) {
        const query = `
      SELECT *
      FROM chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC;
    `;

        const result = await pool.query(query, [documentId]);
        return result.rows;
    }

    async deleteByDocumentId(documentId) {
        const query = `
      DELETE FROM chunks
      WHERE document_id = $1;
    `;

        await pool.query(query, [documentId]);
    }

    async findSimilarChunks({ embedding, limit = 5 }) {
        const query = `
      SELECT
        id,
        document_id,
        chunk_index,
        content,
        metadata,
        created_at,
        updated_at,
        1 - (embedding <=> $1::vector) AS similarity
      FROM chunks
      ORDER BY embedding <=> $1::vector
      LIMIT $2;
    `;

        const result = await pool.query(query, [JSON.stringify(embedding), limit]);
        return result.rows;
    }
}

export default new ChunksRepository();
