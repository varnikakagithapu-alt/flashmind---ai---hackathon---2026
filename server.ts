import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import * as pdfParseModule from 'pdf-parse';

const pdfParse = ((pdfParseModule as any).default || pdfParseModule) as (
  dataBuffer: Buffer,
  options?: any
) => Promise<{
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  version: string;
  text: string;
}>;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Allow JSON bodies up to 25MB for PDFs
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini Client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.8-flash',
  });
});

// PDF Extraction endpoint using pdf-parse
app.post('/api/extract-pdf', async (req, res) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No PDF data provided.' });
    }

    // Strip data URL header if present
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    const data = await pdfParse(buffer);
    const extractedText = (data.text || '').trim();

    if (!extractedText) {
      return res.status(422).json({
        error: 'Could not extract readable text from this PDF. It may contain scanned image-only pages or encrypted contents.',
      });
    }

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    res.json({
      text: extractedText,
      pageCount: data.numpages || 1,
      wordCount,
      title: data.info?.Title || filename || 'Extracted Document',
    });
  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    res.status(500).json({
      error: `Failed to extract text from PDF: ${error.message || 'Unknown parsing error'}`,
    });
  }
});

// Flashcard Generation endpoint
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const {
      text,
      topic = 'General Notes',
      count = 8,
      difficulty = 'Medium',
      cardType = 'Mixed',
      language = 'English',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return res.status(400).json({
        error: 'Please provide at least 20 characters of study notes to generate flashcards.',
      });
    }

    // If Gemini client is not initialized, inform client to use local fallback
    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Falling back to local extractive generation.',
        fallbackRequired: true,
      });
    }

    const cardCount = Math.min(Math.max(parseInt(String(count), 10) || 8, 3), 30);

    const systemPrompt = `You are FlashMind AI, an expert educational tutor specializing in high-retention flashcard synthesis for college and high school students.
Generate exactly ${cardCount} high-yield, distinct flashcards strictly based on the provided study notes.

Rules:
1. Ground every question and answer strictly in the provided text. Do not invent facts absent from the supplied notes.
2. Avoid duplicate questions or redundant concepts.
3. Keep questions direct, clear, and unambiguous.
4. Keep answers concise, memorable, and focused on core principles.
5. Difficulty level: ${difficulty}.
6. Card type preference: ${cardType} (Question and Answer, Definition, or Mixed).
7. Target language: ${language}.
8. Provide a brief 1-sentence memory hint/explanation for each card to accelerate recall.`;

    const userPrompt = `TOPIC/SUBJECT: ${topic}
STUDY NOTES CONTENT:
${text.slice(0, 45000)}

Generate ${cardCount} flashcards according to the rules.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'A list of generated flashcards',
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: 'The clear question, prompt, or term on the front of the flashcard.',
              },
              answer: {
                type: Type.STRING,
                description: 'The concise, accurate answer or definition on the back.',
              },
              subject: {
                type: Type.STRING,
                description: 'The sub-topic or domain classification.',
              },
              difficulty: {
                type: Type.STRING,
                description: 'Easy, Medium, or Hard.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Short explanatory note or memory tip.',
              },
            },
            required: ['question', 'answer'],
          },
        },
      },
    });

    const responseText = response.text?.trim() || '[]';
    let cards = [];
    try {
      cards = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return res.status(500).json({ error: 'AI generated invalid data structure.' });
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(500).json({ error: 'AI returned empty flashcard list.' });
    }

    res.json({
      cards,
      modelUsed: 'gemini-3.8-flash',
      topic,
      difficulty,
    });
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred during AI flashcard generation.',
      fallbackRequired: true,
    });
  }
});

// Quiz generation endpoint (produces multiple choice questions with distractors)
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { cards, topic = 'Review Quiz' } = req.body;

    if (!Array.isArray(cards) || cards.length < 2) {
      return res.status(400).json({
        error: 'At least 2 flashcards are required to construct a quiz.',
      });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'No Gemini API key available; use client-side distractor generator.',
        fallbackRequired: true,
      });
    }

    const cardsSummary = cards
      .slice(0, 20)
      .map((c: any, i: number) => `Card ${i + 1}:\nQ: ${c.question}\nA: ${c.answer}`)
      .join('\n\n');

    const prompt = `Based on these study flashcards, generate multiple-choice questions (1 per card, up to 10 questions).
For each question:
- State the question clearly.
- Provide 4 options (strings).
- Indicate the 0-indexed correct option (correctAnswerIndex: 0, 1, 2, or 3).
- Distractors MUST be plausible and related to the subject, but unambiguously incorrect.
- Provide a concise explanation.

FLASHCARDS:
${cardsSummary}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an assessment specialist creating high quality multiple-choice tests.',
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of exactly 4 choices',
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: 'Index of correct answer (0-3)',
              },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswerIndex'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ questions: parsed });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      error: error.message || 'Quiz generation failed.',
      fallbackRequired: true,
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FlashMind AI server running at http://0.0.0.0:${port}`);
  });
}

startServer();
