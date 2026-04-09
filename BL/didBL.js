import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../services/logger.js';
import * as sessionManager from '../services/sessionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// D-ID Authentication Helper
function getDidAuthHeaders() {
    const key = process.env.DID_API_KEY || '';
    const base64Key = Buffer.from(key).toString('base64');
    return { 'Authorization': `Basic ${base64Key}` };
}

// Reusable fetch wrapper for D-ID requests
async function makeDIDRequest(url, method, bodyJSON) {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...getDidAuthHeaders()
        },
        body: bodyJSON ? JSON.stringify(bodyJSON) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMsg = data.description || data.message || JSON.stringify(data);
        const error = new Error(`D-ID API Error (${response.status}): ${errorMsg}`);
        error.status = response.status;
        error.response = data;
        throw error;
    }

    return data;
}

// Uploads a local image to D-ID
async function uploadImage(filePath) {
    logger.info('Uploading local image to D-ID:', filePath);

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, path.basename(filePath));

    const response = await fetch('https://api.d-id.com/images', {
        method: 'POST',
        headers: {
            ...getDidAuthHeaders()
        },
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`D-ID Image Upload Error: ${data.description || data.message || JSON.stringify(data)}`);
    }

    logger.info('D-ID Image Upload SUCCESS:', data.url);
    return data.url;
}

export const createStream = async (req, res) => {
    const { source_url } = req.body;
    if (!process.env.DID_API_KEY) {
        return res.status(500).json({ detail: 'Missing D-ID Key' });
    }

    try {
        // Automatic Stream Cleanup: delete any recent sessions if they exist
        // This helps mitigate 403 "Max sessions" errors by clearing ghosts.
        const recentSessions = sessionManager.getRecentSessions();
        if (recentSessions.length > 0) {
            logger.info("Auto-cleaning recent D-ID sessions:", recentSessions.length);
            for (const session of recentSessions) {
                if (session.stream_id) {
                    await deleteStreamInternal(session.stream_id, { session_id: session.session_id }).catch(err => {
                        logger.warn(`Failed to cleanup session ${session.stream_id}:`, err.message);
                    });
                }
            }
            sessionManager.clearLastSession();
        }

        let finalUrl = source_url;

        // Local Upload Handling: Be smarter about finding the image on different environments (EC2 vs Local)
        if (source_url && !source_url.startsWith('http') && !source_url.startsWith('s3://')) {
            const possiblePaths = [
                path.join(__dirname, '../../dvir-portfolio/src/assets', source_url),
                path.join(__dirname, '../../dvir-portfolio/public', source_url),
                path.join(__dirname, '../public', source_url),
                path.join(__dirname, '../', source_url),
                path.join(process.cwd(), 'public', source_url),
                path.join(process.cwd(), source_url)
            ];

            let localPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    localPath = p;
                    break;
                }
            }

            if (localPath) {
                logger.info('Found local image, uploading to D-ID:', localPath);
                finalUrl = await uploadImage(localPath);
            } else {
                logger.warn('Local image not found in any known locations, using original source_url:', source_url);
            }
        }

        logger.info('Creating D-ID stream with final URL:', { finalUrl });
        const data = await makeDIDRequest('https://api.d-id.com/talks/streams', 'POST', { source_url: finalUrl });

        // Save this as the 'last' session for future cleanup
        if (data.id) {
            sessionManager.saveLastSession(data.id, data.session_id);
        }

        res.json(data);
    } catch (error) {
        logger.error(error.message, { stack: error.stack, originalError: error.response });
        res.status(error.status || 500).json({ detail: error.message, originalError: error.response });
    }
};

export const startStream = async (req, res) => {
    try {
        const data = await makeDIDRequest(`https://api.d-id.com/talks/streams/${req.params.stream_id}/sdp`, 'POST', req.body);
        res.json(data);
    } catch (error) {
        logger.error(error.message, { stack: error.stack, originalError: error.response });
        res.status(error.status || 500).json({ detail: error.message, originalError: error.response });
    }
};

export const handleIce = async (req, res) => {
    try {
        const data = await makeDIDRequest(`https://api.d-id.com/talks/streams/${req.params.stream_id}/ice`, 'POST', req.body);
        res.json(data);
    } catch (error) {
        logger.error(error.message, { stack: error.stack, originalError: error.response });
        res.status(error.status || 500).json({ detail: error.message, originalError: error.response });
    }
};

export const handleTalk = async (req, res) => {
    try {
        const textInput = (req.body?.script?.input || "").trim();
        const isHebrew = /[\u0590-\u05FF]/.test(textInput);

        // Sanitize text to remove common speech-interfering characters
        const sanitizedText = textInput
            .replace(/[*_~`]/g, '') // Remove markdown decorators
            .replace(/[#]/g, '')     // Remove hash signs
            .trim();

        // Force high-quality English voice
        const maleVoiceId = "en-US-AndrewNeural";
        
        logger.info(`D-ID Talk Request. InputLength: ${sanitizedText.length}. Voice: ${maleVoiceId}`);

        const body = {
            ...req.body,
            script: {
                ...req.body.script,
                input: sanitizedText,
                provider: {
                    type: "microsoft",
                    voice_id: maleVoiceId
                }
            },
            config: {
                ...(req.body.config || {}),
                fluent: true,
                stitch: false, // Disabling stitch reduces the processing delay significantly for long texts
                driver_expressions: {
                    expressions: [
                        {
                            start_frame: 0,
                            expression: "happy", // 'happy', 'serious', 'surprised'
                            intensity: 0.5
                        }
                    ]
                }

            }
        };
        const data = await makeDIDRequest(`https://api.d-id.com/talks/streams/${req.params.stream_id}`, 'POST', body);
        logger.info(`D-ID Talk SUCCESS. ID: ${data.id}. Status: ${data.status}`);
        res.json(data);
    } catch (error) {
        logger.error(error.message, { stack: error.stack, originalError: error.response });
        res.status(error.status || 500).json({ detail: error.message, originalError: error.response });
    }
};

/**
 * Internal helper for deleting streams (used for auto-cleanup)
 */
async function deleteStreamInternal(stream_id, sessionData) {
    try {
        return await makeDIDRequest(`https://api.d-id.com/talks/streams/${stream_id}`, 'DELETE', sessionData);
    } catch (error) {
        if (error.status === 400 || error.status === 404) {
            return { success: true, message: 'Already gone' };
        }
        throw error;
    }
}

export const deleteStream = async (req, res) => {
    logger.info(`DELETE /did/stream/${req.params.stream_id}`, { body: req.body });
    try {
        const data = await makeDIDRequest(`https://api.d-id.com/talks/streams/${req.params.stream_id}`, 'DELETE', req.body);
        res.json(data);
    } catch (error) {
        // Graceful Deletion Handling
        if (error.status === 400 || error.status === 404) {
            logger.warn(`Stream deletion info: ${error.message}`);
            return res.json({ success: true, message: 'Stream already closed or invalid', originalError: error.response });
        }
        logger.error(error.message, { stack: error.stack, originalError: error.response });
        res.status(error.status || 500).json({ detail: error.message, originalError: error.response });
    }
};
