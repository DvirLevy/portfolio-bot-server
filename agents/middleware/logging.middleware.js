import { createMiddleware } from "langchain";
import { logger } from "../../utils/logger.js";

const MAX_LOGGED_CHARS = 500;

function truncate(value) {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    if (!str) return { preview: str, size: 0 };
    return {
        preview: str.length > MAX_LOGGED_CHARS ? `${str.slice(0, MAX_LOGGED_CHARS)}…` : str,
        size: str.length,
    };
}

/**
 * @description middleware that logs every model call and tool call an agent makes, at `info` level, tagged with the run's correlation id
 * @param {string} agentName - name of the agent, used as the log tag
 * @param {() => string} getRunId - returns the current run's correlation id
 * @returns {AgentMiddleware} - middleware to pass into createDomainAgent
 */
export function createLoggingMiddleware(agentName, getRunId) {
    let iteration = 0;

    return createMiddleware({
        name: "LoggingMiddleware",

        wrapModelCall: async (request, handler) => {
            iteration += 1;
            const runId = getRunId();
            const tag = `[agent:${agentName}][run:${runId}]`;
            const start = Date.now();

            const response = await handler(request);

            const durationMs = Date.now() - start;
            const usage = response?.usage_metadata || {};
            const finishReason = response?.response_metadata?.finish_reason;

            logger.info(`${tag} model iteration=${iteration} ${(durationMs / 1000).toFixed(2)}s`, {
                agent: agentName,
                runId,
                iteration,
                durationMs,
                promptTokens: usage.input_tokens,
                completionTokens: usage.output_tokens,
                totalTokens: usage.total_tokens,
                finishReason,
            });

            return response;
        },

        wrapToolCall: async (request, handler) => {
            const runId = getRunId();
            const tag = `[agent:${agentName}][run:${runId}]`;
            const toolName = request.toolCall.name;
            const { preview: argsPreview, size: argsSize } = truncate(request.toolCall.args);
            const start = Date.now();

            logger.info(`${tag} tool:${toolName} start`, {
                agent: agentName,
                runId,
                iteration,
                tool: toolName,
                args: argsPreview,
                argsSize,
            });

            const result = await handler(request);

            const durationMs = Date.now() - start;
            const { preview: resultPreview, size: resultSize } = truncate(result?.content);

            logger.info(`${tag} tool:${toolName} ok ${(durationMs / 1000).toFixed(2)}s size=${resultSize}`, {
                agent: agentName,
                runId,
                iteration,
                tool: toolName,
                durationMs,
                resultSize,
                resultPreview,
            });

            return result;
        },
    });
}
