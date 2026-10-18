import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function geminiAssistantPlugin(): Plugin {
  return {
    name: 'gemini-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/assistant', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { query, metrics, context } = parsed;

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ fallback: true }));
              return;
            }

            const ai = new GoogleGenAI({});
            const systemPrompt = `You are Mate AI, the intelligent Ghanaian SME business advisor for MarketMate GH.
You are assisting a Ghanaian business owner (e.g. Abena at Makola Market, Kejetia, or Kaneshie).
CRITICAL DIRECTIVE: You must NEVER invent financial figures. Calculate and answer strictly from the verified business data provided below.
Always format currency as GH₵ (GHS). Use respectful, warm Ghanaian business fluency (Akwaaba, Medaase, MoMo, trotro, chop money) while keeping financial advice razor-sharp.

VERIFIED BUSINESS METRICS:
${JSON.stringify({ metrics, context }, null, 2)}

Respond with a JSON object conforming to:
{
  "answer": "Clear markdown answer directly addressing the user's question with exact figures from metrics",
  "keyMetrics": [
    { "label": "string", "value": "string", "trend": "optional string" }
  ],
  "suggestedActions": [
    { "label": "string", "actionType": "navigate" | "restock" | "whatsapp" | "report", "payload": "string" }
  ]
}
IMPORTANT: Return ONLY raw JSON without markdown code fences.`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: query,
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
              },
            });

            const text = response.text || '{}';
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err: unknown) {
            console.error('Gemini API Error in /api/assistant:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ fallback: true }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), geminiAssistantPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
