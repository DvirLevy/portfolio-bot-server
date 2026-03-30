import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { ask } from "../ask.service.js";

const result = await ask("What does RAG improve?");
console.log(JSON.stringify(result, null, 2));