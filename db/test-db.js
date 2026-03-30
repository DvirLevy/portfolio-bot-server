import chunksRepository from './repositories/chunks.repository.js';

async function test() {
    try {
        const fakeEmbedding = Array(1536).fill(0.01);

        const insertedChunk = await chunksRepository.insertChunk({
            documentId: 'test-doc-1',
            chunkIndex: 0,
            content: 'Hello from the RAG database test',
            metadata: {
                source: 'manual-test',
                title: 'DB Test',
            },
            embedding: JSON.stringify(fakeEmbedding),
        });

        console.log('Inserted chunk:', insertedChunk);

        const chunks = await chunksRepository.getChunksByDocumentId('test-doc-1');
        console.log('Chunks by document id:', chunks);

        const similarChunks = await chunksRepository.findSimilarChunks({
            embedding: fakeEmbedding,
            limit: 3,
        });
        console.log('Similar chunks:', similarChunks);
    } catch (error) {
        console.error('DB test failed:', error);
    } finally {
        process.exit(0);
    }
}

test().then(() => console.log('DB test completed')).catch((error) => console.error('DB test failed:', error));