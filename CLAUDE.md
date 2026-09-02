# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Express backend for Dvir Levy's Portfolio AI Avatar. It talks to OpenAI to generate personalized, RAG-grounded answers about Dvir (or a company the user names), and coordinates the D-ID API to stream the response as a talking avatar. Pure ESM (`"type": "module"` in package.json) — no build step or TypeScript compilation for the running server.

## Commands

```bash
npm run dev              # nodemon, NODE_ENV=development, loads .env.development
npm start                # node server.js, NODE_ENV=production, loads .env.production
npm test                 # jest (ESM via --experimental-vm-modules)
npx jest path/to/file.test.js   # run a single test file
npx jest -t "test name"         # run tests matching a name

npm run rag-db           # docker-compose up: local Postgres+pgvector (docker/docker-compose-rag-db.yml)
npm run close-db         # stop that container
npm run connect-db       # psql shell into it (rag-postgres / rag_db)

npm run ingest           # ts-node services/langChain/test-scripts/inget-test.ts (manual RAG smoke test)
npm run ask              # ts-node services/langChain/test-scripts/ask-test.ts
```

`ingest`/`ask` scripts require a global/dev `ts-node` — it isn't in `package.json`'s dependencies, so `npx ts-node` or a local install may be needed if the bare command fails.

Env files are `.env.development` / `.env.production` (gitignored, loaded by `server.js` based on `NODE_ENV`), **not** the plain `.env` at the repo root. Required vars: `OPENAI_API_KEY`, `OPENAI_MODEL`, `DID_API_KEY`, `PORT`, and `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` (each DB var falls back to a local-Postgres default if unset).

DB schema changes live in `db/migrations/*.sql` — there is no migration runner; apply them by hand (`npm run connect-db` then `\i db/migrations/00X_....sql`) against a Postgres instance with the `pgvector` extension.

## Architecture

**Request flow:** `server.js` → `Router/apiIndexRoute.js` mounts three sub-routers under `/api`: `/did` (didRoute), `/chat` (chatRoute), `/rag` (ragRoutes, which itself mounts `companyRoutes` under `/rag/company`). Routers are thin — they just call into `BL/` (business logic) or `services/langChain/`.

**Two independent OpenAI paths — don't conflate them:**
- `BL/chatBL.js` (`POST /api/chat`) is a **stateless, non-RAG** quick-reply path: one system prompt + user message, `max_tokens: 75`, used for short avatar utterances. On `insufficient_quota`/429 it returns a canned apology instead of erroring, so the demo still "works" without OpenAI credits.
- `services/langChain/ask/askOrchestrator.service.js` (`POST /api/rag/ask`) is the **RAG pipeline**: classify → retrieve → generate. This is the one to touch for anything about answer quality/grounding.

**RAG pipeline (`services/langChain/ask/`):**
1. `classifyQuestion.service.js` asks OpenAI to label the question `'DvirResume'` or a normalized company name (lowercase, underscores). Falls back to `'DvirResume'` on any error.
2. `askOrchestrator.service.js` uses that classification as the **pgvector table/collection name** and picks either `askForDvirResume.service.js` or `askForCompany.service.js`.
3. Both ask-handlers do the same shape of work: translate non-English questions to English before retrieval (`prompts.translationContentPrompt`), pull top-4 docs via `retriever.invoke`, stuff them into a system prompt (`prompts.getSystemPrompt` / `getCompanySystemPrompt`), and return `{ reply, language, sources }`.
4. `askForCompany.service.js` calls `ingestCompany()` synchronously before answering — if the company has never been ingested, `askOrchestrator` triggers ingestion (via OpenAI research) on the user's request path, which adds real latency the first time any given company is asked about.
5. `onRender=true` on `askOrchestrator` skips the whole pipeline and returns a canned intro after a fixed 3s delay — used to prime the D-ID render before a real question arrives.

**Company ingestion (`services/langChain/ingestCompany.service.js`):** checks `companies` table (`db/repositories/company.repository.js`) by normalized name; if absent, calls `comapyResearch.js` (OpenAI, prompted for strict JSON matching a fixed schema — note the file is misspelled "comapy"), upserts the structured result, splits it into topic chunks (`companyChunk.service.js`: overview/products/finance sections), and embeds those into a **company-specific pgvector table** named after the normalized company name.

**Vector storage (`utils/vector-store.js`):** `getVectorStore(tableName)` wraps `PGVectorStore.initialize` — every distinct classification value becomes/uses its own pgvector table (`DvirResume`, or `<normalized_company_name>`), auto-created by LangChain on first write. `db/repositories/chunks.repository.js` and the `chunks` table (raw SQL, manual embedding column) are a separate/legacy path not used by the current ingest flow — LangChain's `PGVectorStore` manages its own tables directly.

**Prompts (`services/prompts.js`):** loads static instruction/biography `.txt` files at import time and composes them with retrieved RAG context and a target `language` for every OpenAI call. Both `getSystemPrompt` (Dvir) and `getCompanySystemPrompt` (company) forbid inventing facts outside the provided context/biography.

**D-ID avatar streaming (`BL/didBL.js`):** thin proxy over D-ID's `/talks/streams` REST API (create/start/ice/talk/delete), Basic-auth'd from `DID_API_KEY`. `createStream` auto-cleans previously-tracked sessions first to avoid D-ID's "max concurrent sessions" errors; `services/sessionManager.js` persists the last-known sessions to `logs/last_session.json` (gitignored) for that cleanup, capped at 10 entries, deduped by `stream_id`. `handleTalk` strips markdown/formatting from the text before sending it to D-ID's TTS and picks a voice by detecting Hebrew via Unicode range.

**Cross-cutting:**
- `utils/logger.js`: winston, writes to `logs/error.log` + `logs/combined.log` + console (colorized in dev); log level is `info` in production, `debug` otherwise.
- `services/rateLimiter.js`: applied globally in `server.js` before routes.
- CORS in `server.js` is a fixed allowlist of the production frontend origins — update it there when adding a new frontend domain.
- `server.js` also serves the project root as static files and exposes `GET /health`.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`: a `test` job runs `npm test` and emails the result (success or failure) via Gmail SMTP; a `deploy` job runs only if tests pass, SSHing into EC2 to `git reset --hard origin/main`, `npm ci`, and `pm2 restart ecosystem.config.cjs --env production`. Required secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `MAIL_USERNAME`, `MAIL_PASSWORD` (Gmail App Password).
