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

