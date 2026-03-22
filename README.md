# Portfolio Bot Server

This is the Express backend for the Dvir Levy Portfolio AI Avatar. It manages communication with OpenAI to generate intelligent, personalized responses, and coordinates the D-ID API to stream the responses as a talking avatar.

## The Architecture
The server is structured into the following layers:
- **`server.js`**: The main entry point that initializes the Express application and mounts the central API router.
- **`Router/`**: Handles all the routing logic. 
  - `apiIndexRoute.js`: The central hub that delegates routes to specialized routers.
  - `chatRoute.js`: Defines exactly how the user interacts with the AI chatbot endpoint.
  - `didRoute.js`: Defines all endpoints for managing the video streaming connection with D-ID.
- **`BL/` (Business Logic)**: The core code handling all server functionality.
  - `chatBL.js`: Talks to OpenAI, injecting system prompts and blueprints, returning generated answers.
  - `didBL.js`: Handles fetching and communicating with D-ID's streaming API.
- **`services/`**: Holds configuration and context logic, such as `prompts.js` and JSON files for the Q&A blueprint.

## How the AI Generates Responses (OpenAI Integration)
Are the responses simply hardcoded find-and-replaces from the server, or is the OpenAI "brain" really generating them? 

**The responses are 100% generated dynamically by OpenAI's brain in real time!**

You may notice that `prompts.js` and the `qa_blueprint_*.json` files contain pre-written answers. However, your server is **not** just doing a simple search to spit those answers out directly. 

Here is exactly how it works:
1. **The Blueprint is "Context"**: The hardcoded JSON responses act as strict guidelines given to the OpenAI model. We feed this blueprint to OpenAI as a "System Prompt" (or context instructions). 
2. **OpenAI Thinks About It**: When a user types a message in the chat, the text goes straight through `BL/chatBL.js` to OpenAI (`gpt-4o-mini`).
3. **OpenAI Generates the Response**: OpenAI reads the user's message, then reads your blueprint. It uses its LLM (Large Language Model) brain to figure out what the user is asking, finds the relevant information from your blueprint, and then **generates a brand new, natural conversational response** using that knowledge.

**Why is this better than answering without the blueprint?**
If we didn't give OpenAI those hardcoded blueprints, the AI could suffer from "hallucinations"—it might invent a fake job you never worked at, or guess your skills incorrectly! The blueprint keeps the AI strictly bounded to your real resume and personality, ensuring your portfolio bot sounds perfectly knowledgeable about *you*, but still conversational and intelligent enough to handle greetings, follow-ups, and phrasing things naturally.
