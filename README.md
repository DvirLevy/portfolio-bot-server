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

## CI/CD

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs in two jobs:
1. **test**: installs dependencies and runs `npm test`. An email is sent via Gmail SMTP either way: on failure the deploy job is skipped, on success the deploy proceeds.
2. **deploy**: only runs if `test` passes; SSHes into the EC2 instance, pulls `main`, and restarts the app with `pm2`.

Required GitHub Actions secrets:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` — SSH access to the deployment server.
- `MAIL_USERNAME` — Gmail address used to send failure notifications.
- `MAIL_PASSWORD` — a Gmail [App Password](https://myaccount.google.com/apppasswords) (requires 2FA), not the regular account password.

