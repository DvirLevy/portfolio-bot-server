import { randomUUID } from "node:crypto";
import { isAIMessage, isToolMessage } from "@langchain/core/messages";
import { getAgent } from "./agentRegistry.js";
import { logger } from "../../utils/logger.js";

function buildTrace(messages = []) {
    const toolCallsById = new Map();
    const trace = [];

    for (const message of messages) {
        if (isAIMessage(message)) {
            const usage = message.usage_metadata;
            trace.push({
                type: "model_call",
                toolCalls: (message.tool_calls || []).map((tc) => tc.name),
                promptTokens: usage?.input_tokens,
                completionTokens: usage?.output_tokens,
                totalTokens: usage?.total_tokens,
            });
            for (const toolCall of message.tool_calls || []) {
                toolCallsById.set(toolCall.id, { name: toolCall.name, args: toolCall.args });
            }
        } else if (isToolMessage(message)) {
            const call = toolCallsById.get(message.tool_call_id) || {};
            trace.push({
                type: "tool_call",
                tool: message.name || call.name,
                args: call.args,
                status: message.status || "success",
            });
        }
    }

    return trace;
}

/**
 * @description the single entry point for running any registered agent — services must call this instead of touching an agent's invoke directly. Owns the run's correlation id, start/end logging, and turns the agent's raw message history into the compact trace persisted as agent_trace.
 * @param {string} agentName - name the agent was registered under (see agentRegistry.registerAgent)
 * @param {object} params
 * @param {object} params.input - passed through to the agent as { messages: [...] } input
 * @param {object} [params.context] - per-invocation runtime context handed to every tool as `runtime.context` (e.g. the uploaded file buffer) — kept out of the model's message history entirely
 * @param {object} [params.logContext] - extra fields (e.g. scanId, filename) attached to the start/end log lines
 * @returns {Promise<{ output: object, trace: Array<object>, runId: string, durationMs: number }>}
 */
export async function runAgent(agentName, { input, context, logContext = {} }) {
    const agent = getAgent(agentName);
    const runId = randomUUID().slice(0, 8);
    const tag = `[agent:${agentName}][run:${runId}]`;
    const start = Date.now();

    logger.info(`${tag} run start`, { agent: agentName, runId, ...logContext });

    try {
        const result = await agent.invoke(input, { runId, context });
        const trace = buildTrace(result.messages);
        const durationMs = Date.now() - start;

        logger.info(`${tag} run end status=completed ${(durationMs / 1000).toFixed(2)}s tool_calls=${trace.filter((t) => t.type === "tool_call").length}`, {
            agent: agentName,
            runId,
            status: "completed",
            durationMs,
            iterations: trace.filter((t) => t.type === "model_call").length,
            toolCallCount: trace.filter((t) => t.type === "tool_call").length,
            ...logContext,
        });

        return {
            output: result.structuredResponse ?? result.messages.at(-1)?.content,
            trace,
            runId,
            durationMs,
        };
    } catch (error) {
        const durationMs = Date.now() - start;
        logger.error(`${tag} run end status=failed ${(durationMs / 1000).toFixed(2)}s: ${error.message}`, {
            agent: agentName,
            runId,
            status: "failed",
            durationMs,
            error: error.message,
            stack: error.stack,
            ...logContext,
        });
        throw error;
    }
}
