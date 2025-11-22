// Simple local dev server for API routes
// Run this alongside `npm run dev` for local development
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001; // Different port from Vite (5173)

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API route - proxy to Mistral
app.post('/api/chat', async (req, res) => {
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!mistralApiKey) {
    return res.status(500).json({
      error: 'Mistral API key not configured. Set MISTRAL_API_KEY in your .env file'
    });
  }

  try {
    const { messages, tools, tool_choice } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request: messages array is required'
      });
    }

    const payload = {
      model: 'mistral-large-latest',
      messages: messages,
    };

    if (tools && Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = tool_choice || 'auto';
    }

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
      return res.status(mistralResponse.status).json({
        error: `Mistral API error: ${mistralResponse.status}`,
        details: errorText
      });
    }

    const data = await mistralResponse.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying Mistral API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure MISTRAL_API_KEY is set in your .env file`);
});

