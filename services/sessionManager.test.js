import { jest } from '@jest/globals';

const mockFs = {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
};

jest.unstable_mockModule('fs', () => ({ default: mockFs, ...mockFs }));
jest.unstable_mockModule('../utils/logger.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { getRecentSessions, saveLastSession, clearLastSession } = await import('./sessionManager.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getRecentSessions', () => {
    it('returns an empty array when the session file does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);

        expect(getRecentSessions()).toEqual([]);
    });

    it('returns the parsed array when the session file exists', () => {
        const sessions = [{ stream_id: 's1', session_id: 'a' }];
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(sessions));

        expect(getRecentSessions()).toEqual(sessions);
    });

    it('wraps a single non-array session into an array', () => {
        const session = { stream_id: 's1', session_id: 'a' };
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(session));

        expect(getRecentSessions()).toEqual([session]);
    });

    it('returns an empty array when the file contents are invalid JSON', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('not json');

        expect(getRecentSessions()).toEqual([]);
    });
});

describe('saveLastSession', () => {
    it('prepends the new session and writes it to disk', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify([{ stream_id: 'old', session_id: 'b' }]));

        saveLastSession('new', 'a');

        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
        const [, data] = mockFs.writeFileSync.mock.calls[0];
        expect(JSON.parse(data)).toEqual([
            { stream_id: 'new', session_id: 'a' },
            { stream_id: 'old', session_id: 'b' },
        ]);
    });

    it('deduplicates sessions by stream_id, keeping the newest', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify([{ stream_id: 'dup', session_id: 'old-session' }]));

        saveLastSession('dup', 'new-session');

        const [, data] = mockFs.writeFileSync.mock.calls[0];
        expect(JSON.parse(data)).toEqual([{ stream_id: 'dup', session_id: 'new-session' }]);
    });

    it('keeps only the 10 most recent sessions', () => {
        const existing = Array.from({ length: 10 }, (_, i) => ({ stream_id: `s${i}`, session_id: `id${i}` }));
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(existing));

        saveLastSession('new-stream', 'new-id');

        const [, data] = mockFs.writeFileSync.mock.calls[0];
        const written = JSON.parse(data);
        expect(written).toHaveLength(10);
        expect(written[0]).toEqual({ stream_id: 'new-stream', session_id: 'new-id' });
    });

    it('creates the logs directory if it does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);

        saveLastSession('s1', 'a');

        expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('does not throw when writing fails', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('[]');
        mockFs.writeFileSync.mockImplementation(() => {
            throw new Error('disk full');
        });

        expect(() => saveLastSession('s1', 'a')).not.toThrow();
    });
});

describe('clearLastSession', () => {
    it('writes an empty array when the session file exists', () => {
        mockFs.existsSync.mockReturnValue(true);

        clearLastSession();

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.any(String), '[]');
    });

    it('does nothing when the session file does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);

        clearLastSession();

        expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
});
