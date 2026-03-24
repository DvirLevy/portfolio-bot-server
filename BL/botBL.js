import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { getSystemPrompt } from "../services/prompts.js";
import { logger } from "../services/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// D-ID Authentication Helper
function getDIDAuthHeader() {
  const key = process.env.DID_API_KEY || "";
  const base64Key = Buffer.from(key).toString("base64");
  return `Basic ${base64Key}`;
}

// Reusable fetch wrapper for D-ID requests
async function makeDIDRequest(url, method, bodyJSON) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": getDIDAuthHeader()
    },
    body: bodyJSON ? JSON.stringify(bodyJSON) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.description || data.message || JSON.stringify(data);
    const error = new Error(`D-ID API Error (${response.status}): ${errorMsg}`);
    error.response = data; // Attach the original response for debugging
    throw error;
  }

  return data;
}

/**
 * Uploads a local image to D-ID and returns the D-ID hosted URL
 */
async function uploadImage(filePath) {
  logger.info("Uploading local image to D-ID:", filePath);
  
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/png" });
  const formData = new FormData();
  formData.append("image", blob, path.basename(filePath));

  const response = await fetch("https://api.d-id.com/images", {
    method: "POST",
    headers: {
      "Authorization": getDIDAuthHeader()
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`D-ID Image Upload Error: ${data.description || data.message || JSON.stringify(data)}`);
  }
  
  logger.info("D-ID Image Upload SUCCESS:", data.url);
  return data.url;
}

/**
 * Creates a new Data stream with D-ID
 */
export async function createStream(source_url) {
  if (!process.env.DID_API_KEY) {
    throw new Error("Missing D-ID Key");
  }

  let finalUrl = source_url;

  // If it's a local filename (no http/s3 prefix), upload it first
  if (source_url && !source_url.startsWith("http") && !source_url.startsWith("s3://")) {
    const localPath = path.join(__dirname, "../../dvir-portfolio/src/assets", source_url);
    if (fs.existsSync(localPath)) {
      finalUrl = await uploadImage(localPath);
    } else {
      // Fallback to backend root if not found in frontend assets
      const backendPath = path.join(__dirname, "../", source_url);
      if (fs.existsSync(backendPath)) {
        finalUrl = await uploadImage(backendPath);
      } else {
        logger.warn("Local image not found, using original source_url:", source_url);
      }
    }
  }

  logger.info("Creating D-ID stream with final URL:", { finalUrl });
  return await makeDIDRequest("https://api.d-id.com/talks/streams", "POST", { source_url: finalUrl });
}

/**
 * Starts the stream with SDP Answer
 */
export async function startStream(stream_id, answer, session_id) {
  return await makeDIDRequest(`https://api.d-id.com/talks/streams/${stream_id}/sdp`, "POST", { answer, session_id });
}

/**
 * Submits an ICE candidate
 */
export async function submitIceCandidate(stream_id, candidateData) {
  return await makeDIDRequest(`https://api.d-id.com/talks/streams/${stream_id}/ice`, "POST", candidateData);
}

/**
 * Generates speech for the avatar to talk
 */
export async function talkToStream(stream_id, scriptData) {
  return await makeDIDRequest(`https://api.d-id.com/talks/streams/${stream_id}`, "POST", scriptData);
}

/**
 * Deletes the stream connection
 */
export async function deleteStream(stream_id, sessionData) {
  return await makeDIDRequest(`https://api.d-id.com/talks/streams/${stream_id}`, "DELETE", sessionData);
}

/**
 * Generates an AI reply using OpenAI based on the user's message
 */
export async function getChatReply(message, language = "en-US") {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing.");
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getSystemPrompt(language) },
        { role: "user", content: message }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    const errStr = error.toString();
    if (errStr.includes("insufficient_quota") || errStr.includes("429")) {
      return "I am so sorry! My OpenAI account ran out of credits. However, you can hear that my speech and web setup are working perfectly fine!";
    }
    throw error;
  }
}
