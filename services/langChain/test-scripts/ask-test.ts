import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { askOrchestrator } from "../ask/askOrchestrator.service.js";

const result = await askOrchestrator("What does RAG improve?");
console.log(JSON.stringify(result, null, 2));