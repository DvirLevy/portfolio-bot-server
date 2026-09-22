import { AsyncLocalStorage } from "node:async_hooks";
import { createAgent } from "langchain";
import OpenAI from "../../utils/openAI.js";
import { createLoggingMiddleware } from "../middleware/logging.middleware.js";
import { createToolErrorMiddleware } from "../middleware/toolError.middleware.js";

/**
 * @description builds a ReAct agent with house defaults: model built via the shared OpenAI wrapper, logging + tool-error middleware wired in, and a bounded iteration count. This is the only place in the codebase that should call the underlying `createAgent` — everything else goes through runAgent.
 * @param {object} params
 * @param {string} params.name - agent name, used as the log tag and registry key
 * @param {string} params.systemPrompt - the agent's system prompt
 * @param {Array} params.tools - tools built with the `tool()` helper from @langchain/core/tools
 * @param {object} [params.responseFormat] - optional zod schema for structured output
 * @param {number} [params.temperature] - model temperature, default 0
 * @param {number} [params.maxIterations] - recursion/iteration cap, default 10
 * @returns {{ name: string, maxIterations: number, invoke: (input: object, options: { runId: string, context?: object }) => Promise<object> }}
 */
export function createDomainAgent({ name, systemPrompt, tools, responseFormat, temperature = 0, maxIterations = 10 }) {
    const model = new OpenAI(temperature).model;

    // AsyncLocalStorage (not a closure variable) so concurrent invocations of the
    // same cached agent instance don't clobber each other's runId in the logs.
    const runContext = new AsyncLocalStorage();
    const getRunId = () => runContext.getStore();

    const agent = createAgent({
        model,
        tools,
        systemPrompt,
        ...(responseFormat ? { responseFormat } : {}),
        middleware: [
            createLoggingMiddleware(name, getRunId),
            createToolErrorMiddleware(name, getRunId),
        ],
    });

    return {
        name,
        maxIterations,
        invoke(input, { runId, context }) {
            return runContext.run(runId, () =>
                agent.invoke(input, { recursionLimit: maxIterations * 2, context })
            );
        },
    };
}
