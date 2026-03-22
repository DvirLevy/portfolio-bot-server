import { OpenAI } from 'openai';
import { getSystemPrompt } from '../services/prompts.js';

export const chatWithAvatar = async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ detail: 'OpenAI API key is missing.' });
    }
    
    // Instantiate dynamically so it doesn't fail if env vars aren't loaded at import time
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    
    const { message, language = 'en-US' } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: getSystemPrompt(language) },
                { role: 'user', content: message }
            ],
            max_tokens: 150,
            temperature: 0.7
        });
        
        const answer = response.choices[0].message.content;
        res.json({ reply: answer });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('insufficient_quota') || errorMessage.includes('429')) {
            const mockAnswer = 'I am so sorry! My OpenAI account ran out of credits. However, you can hear that my speech and web setup are working perfectly fine!';
            return res.json({ reply: mockAnswer });
        }
        res.status(500).json({ detail: errorMessage });
    }
};
