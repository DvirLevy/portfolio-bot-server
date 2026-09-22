import { createMiddleware } from "langchain";
import { ToolMessage } from "@langchain/core/messages";
import { logger } from "../../utils/logger.js";

/**
 * @description middleware that catches tool-call failures, logs them at `error` level, and hands the agent back a ToolMessage describing the failure instead of crashing the run — so the model can decide to retry with a different tool
 * @param {string} agentName - name of the agent, used as the log tag
 * @param {() => string} getRunId - returns the current run's correlation id
 * @returns {AgentMiddleware} - middleware to pass into createDomainAgent
 */
export function createToolErrorMiddleware(agentName, getRunId) {
    return createMiddleware({
        name: "ToolErrorMiddleware",

        wrapToolCall: async (request, handler) => {
            try {
                return await handler(request);
            } catch (error) {
                const runId = getRunId();
                const toolName = request.toolCall.name;

                logger.error(`[agent:${agentName}][run:${runId}] tool:${toolName} failed: ${error.message}`, {
                    agent: agentName,
                    runId,
                    tool: toolName,
                    error: error.message,
                    stack: error.stack,
                });

                return new ToolMessage({
                    content: `Tool "${toolName}" failed: ${error.message}`,
                    tool_call_id: request.toolCall.id,
                    status: "error",
                });
            }
        },
    });
}
