import type { VercelRequest, VercelResponse } from '@vercel/node';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = 'mistral-large-latest';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const mistralApiKey = process.env.MISTRAL_API_KEY;

    if (!mistralApiKey) {
        return response.status(500).json({
            error: 'Mistral API key not configured on server'
        });
    }

    try {
        const { messages, tools, tool_choice } = request.body;

        if (!messages || !Array.isArray(messages)) {
            return response.status(400).json({
                error: 'Invalid request: messages array is required'
            });
        }

        const payload: any = {
            model: MODEL,
            messages: messages,
        };

        if (tools && Array.isArray(tools) && tools.length > 0) {
            payload.tools = tools;
            payload.tool_choice = tool_choice || 'auto';
        }   

        const mistralResponse = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!mistralResponse.ok) {
            const errorText = await mistralResponse.text();
            console.error('Mistral API error:', mistralResponse.status, errorText);
            return response.status(mistralResponse.status).json({
                error: `Mistral API error: ${mistralResponse.status}`,
                details: errorText
            });
        }

        const data = await mistralResponse.json();

        return response.status(200).json(data);
    } catch (error) {
        console.error('Error proxying Mistral API:', error);
        return response.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

