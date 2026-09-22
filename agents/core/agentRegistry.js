const factories = new Map();
const cache = new Map();

/**
 * @description registers a lazy agent factory under a name. The factory does not run until the agent is first requested via getAgent — this matters because agent construction reads env vars (API keys) through utils/openAI.js, and those aren't safe to read at module-import time in this codebase.
 * @param {string} name - unique agent name
 * @param {() => object} factory - function that builds and returns the agent (see createDomainAgent)
 */
export function registerAgent(name, factory) {
    if (factories.has(name)) {
        throw new Error(`agentRegistry: agent "${name}" is already registered`);
    }
    factories.set(name, factory);
}

/**
 * @description returns the agent for a given name, building it on first call and caching it thereafter.
 * @param {string} name - agent name passed to registerAgent
 * @returns {object} - the built agent (see createDomainAgent's return shape)
 */
export function getAgent(name) {
    if (cache.has(name)) {
        return cache.get(name);
    }

    const factory = factories.get(name);
    if (!factory) {
        throw new Error(`agentRegistry: no agent registered under "${name}"`);
    }

    const agent = factory();
    cache.set(name, agent);
    return agent;
}
