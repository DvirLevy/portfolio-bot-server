import { OpenAI } from 'openai';
import prompts from '../services/prompts.js';
import { logger } from '../utils/logger.js';

export const chatWithAvatar = async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        logger.error('OpenAI API key is missing.');
        return res.status(500).json({ detail: 'OpenAI API key is missing.' });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const { message, language = 'en-US' } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompts.getSystemPrompt(language) },
                { role: 'user', content: message }
            ],
            max_tokens: 75,
            temperature: 0.7
        });

        const answer = response.choices[0].message.content;
        res.json({ reply: answer });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error('OpenAI Error:', { message: errorMessage, stack: e.stack });

        if (errorMessage.includes('insufficient_quota') || errorMessage.includes('429')) {
            const mockAnswer = 'I am so sorry! My OpenAI account ran out of credits. However, you can hear that my speech and web setup are working perfectly fine!';
            return res.json({ reply: mockAnswer });
        }
        res.status(500).json({ detail: errorMessage });
    }
};
