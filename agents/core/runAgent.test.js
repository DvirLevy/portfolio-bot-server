import { jest } from '@jest/globals';
import { AIMessage, ToolMessage, HumanMessage } from '@langchain/core/messages';

const mockAgent = { invoke: jest.fn() };
const mockGetAgent = jest.fn(() => mockAgent);

jest.unstable_mockModule('./agentRegistry.js', () => ({
    getAgent: mockGetAgent,
}));
jest.unstable_mockModule('../../utils/logger.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { runAgent } = await import('./runAgent.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('runAgent', () => {
    it('runs the named agent and returns output, trace, runId and durationMs', async () => {
        mockAgent.invoke.mockResolvedValue({
            messages: [
                new HumanMessage('scan this'),
                new AIMessage({
                    content: '',
                    tool_calls: [{ id: 'call_1', name: 'inspect_document', args: {} }],
                    usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
                }),
                new ToolMessage({ content: '{"pageCount":1}', tool_call_id: 'call_1', name: 'inspect_document' }),
                new AIMessage({ content: 'done', usage_metadata: { input_tokens: 20, output_tokens: 8, total_tokens: 28 } }),
            ],
            structuredResponse: { title: 'My Doc', extractedText: 'hello' },
        });

        const result = await runAgent('documentScan', { input: { messages: [] }, logContext: { scanId: 's1' } });

        expect(mockGetAgent).toHaveBeenCalledWith('documentScan');
        expect(result.output).toEqual({ title: 'My Doc', extractedText: 'hello' });
        expect(result.runId).toEqual(expect.any(String));
        expect(result.durationMs).toEqual(expect.any(Number));

        expect(result.trace).toEqual([
            { type: 'model_call', toolCalls: ['inspect_document'], promptTokens: 10, completionTokens: 5, totalTokens: 15 },
            { type: 'tool_call', tool: 'inspect_document', args: {}, status: 'success' },
            { type: 'model_call', toolCalls: [], promptTokens: 20, completionTokens: 8, totalTokens: 28 },
        ]);
    });

    it('falls back to the last message content when there is no structuredResponse', async () => {
        mockAgent.invoke.mockResolvedValue({
            messages: [new AIMessage('plain text answer')],
        });

        const result = await runAgent('documentScan', { input: { messages: [] } });

        expect(result.output).toBe('plain text answer');
    });

    it('passes the generated runId and context through to agent.invoke', async () => {
        mockAgent.invoke.mockResolvedValue({ messages: [] });

        await runAgent('documentScan', { input: { messages: [] }, context: { filename: 'a.pdf' } });

        const [, options] = mockAgent.invoke.mock.calls[0];
        expect(options.runId).toEqual(expect.any(String));
        expect(options.context).toEqual({ filename: 'a.pdf' });
    });

    it('logs and rethrows when the agent invocation fails', async () => {
        mockAgent.invoke.mockRejectedValue(new Error('model unavailable'));

        await expect(runAgent('documentScan', { input: { messages: [] } })).rejects.toThrow('model unavailable');
    });
});
