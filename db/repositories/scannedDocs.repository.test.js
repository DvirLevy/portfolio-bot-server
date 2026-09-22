import { jest } from '@jest/globals';

const mockPool = { query: jest.fn() };

jest.unstable_mockModule('../ylClient.js', () => ({
    getYlPool: () => mockPool,
}));
jest.unstable_mockModule('../../utils/logger.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const {
    createScannedDoc,
    getScannedDocByChecksum,
    getScannedDocById,
    updateScannedDocStatus,
    resetStaleProcessingScans,
} = await import('./scannedDocs.repository.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createScannedDoc', () => {
    it('inserts a pending row and returns it', async () => {
        const row = { id: '1', status: 'pending' };
        mockPool.query.mockResolvedValue({ rows: [row] });

        const result = await createScannedDoc({
            originalFilename: 'a.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 100,
            checksum: 'abc',
        });

        expect(result).toEqual(row);
        const [query, values] = mockPool.query.mock.calls[0];
        expect(query).toMatch(/INSERT INTO scanned_docs/);
        expect(values).toEqual(['a.pdf', 'application/pdf', 100, 'abc']);
    });

    it('throws when the query fails', async () => {
        mockPool.query.mockRejectedValue(new Error('db down'));

        await expect(createScannedDoc({ originalFilename: 'a.pdf', mimeType: 'application/pdf', fileSizeBytes: 1, checksum: 'x' }))
            .rejects.toThrow('db down');
    });
});

describe('getScannedDocByChecksum', () => {
    it('returns the matching row', async () => {
        const row = { id: '1', checksum: 'abc' };
        mockPool.query.mockResolvedValue({ rows: [row] });

        expect(await getScannedDocByChecksum('abc')).toEqual(row);
    });

    it('returns undefined when nothing matches', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        expect(await getScannedDocByChecksum('missing')).toBeUndefined();
    });
});

describe('getScannedDocById', () => {
    it('returns the matching row', async () => {
        const row = { id: '1' };
        mockPool.query.mockResolvedValue({ rows: [row] });

        expect(await getScannedDocById('1')).toEqual(row);
    });
});

describe('updateScannedDocStatus', () => {
    it('updates status with no extra fields', async () => {
        mockPool.query.mockResolvedValue({ rows: [{ id: '1', status: 'processing' }] });

        await updateScannedDocStatus('1', 'processing');

        const [query, values] = mockPool.query.mock.calls[0];
        expect(query).toMatch(/SET status = \$2, updated_at = NOW\(\)/);
        expect(values).toEqual(['1', 'processing']);
    });

    it('casts known jsonb columns and passes plain columns through', async () => {
        mockPool.query.mockResolvedValue({ rows: [{ id: '1' }] });

        await updateScannedDocStatus('1', 'completed', {
            title: 'My Doc',
            extracted_data: { foo: 'bar' },
            chunk_count: 5,
        });

        const [query, values] = mockPool.query.mock.calls[0];
        expect(query).toContain('title = $3');
        expect(query).toContain('extracted_data = $4::jsonb');
        expect(query).toContain('chunk_count = $5');
        expect(values).toEqual(['1', 'completed', 'My Doc', JSON.stringify({ foo: 'bar' }), 5]);
    });

    it('rejects an unknown column before touching the database', async () => {
        await expect(updateScannedDocStatus('1', 'failed', { not_a_real_column: 'x' }))
            .rejects.toThrow('unknown column "not_a_real_column"');

        expect(mockPool.query).not.toHaveBeenCalled();
    });
});

describe('resetStaleProcessingScans', () => {
    it('returns the number of rows reset', async () => {
        mockPool.query.mockResolvedValue({ rows: [{ id: '1' }, { id: '2' }] });

        const count = await resetStaleProcessingScans(30);

        expect(count).toBe(2);
        const [query, values] = mockPool.query.mock.calls[0];
        expect(query).toMatch(/status = 'processing'/);
        expect(values).toEqual([30]);
    });

    it('defaults to 30 minutes when not specified', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        await resetStaleProcessingScans();

        const [, values] = mockPool.query.mock.calls[0];
        expect(values).toEqual([30]);
    });
});
