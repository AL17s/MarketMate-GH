import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini Business Advisor Endpoint
app.post('/api/assistant', async (req, res) => {
  try {
    const { query, metrics, context } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({ fallback: true });
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
    res.send(text);
  } catch (err) {
    console.error('Server error in /api/assistant:', err);
    res.json({ fallback: true });
  }
});

// Serve frontend build static files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MarketMate GH server listening on port ${PORT}`);
});
