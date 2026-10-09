import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import * as pdfParseModule from 'pdf-parse';
import { chunkDocument, distributeCardCounts, deduplicateAndRankCards } from './src/utils/chunking.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Allow JSON bodies up to 50MB for large PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to extract text using pdf-parse (handles v2 PDFParse class and legacy function)
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<{ text: string; pageCount: number; title?: string }> {
  const mod = pdfParseModule as any;
  const PDFParseClass = mod.PDFParse || mod.default?.PDFParse;

  if (typeof PDFParseClass === 'function') {
    const parser = new PDFParseClass({ data: buffer });
    try {
      const textResult = await parser.getText();
      let extractedText = '';

      if (Array.isArray(textResult?.pages) && textResult.pages.length > 0) {
        extractedText = textResult.pages
          .map((p: any) => (p?.text || '').trim())
          .filter(Boolean)
          .join('\n\n');
      } else if (textResult?.text) {
        extractedText = textResult.text.replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();
      }

      let title: string | undefined;
      try {
        const infoResult = await parser.getInfo();
        if (infoResult?.info?.Title) {
          title = String(infoResult.info.Title).trim();
        }
      } catch {
        // info extraction non-fatal
      }

      const pageCount = textResult?.total || (Array.isArray(textResult?.pages) ? textResult.pages.length : 1);
      return { text: extractedText, pageCount, title };
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {});
      }
    }
  }

  // Fallback for legacy v1 function signatures
  const legacyParser = typeof mod.default === 'function' ? mod.default : (typeof mod === 'function' ? mod : null);
  if (typeof legacyParser === 'function') {
    const data = await legacyParser(buffer);
    return {
      text: (data?.text || '').trim(),
      pageCount: data?.numpages || 1,
      title: data?.info?.Title,
    };
  }

  throw new Error('PDF parsing library could not initialize a compatible PDF parser instance.');
}

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

// PDF Extraction endpoint using pdf-parse with multimodal Gemini fallback
app.post('/api/extract-pdf', async (req, res) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No PDF data provided.' });
    }

    // Strip any data URI prefix (e.g. data:application/pdf;base64, or data:application/octet-stream;base64,) and whitespace
    let cleanBase64 = String(base64Data);
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    let extractedText = '';
    let pageCount = 1;
    let docTitle = (filename || 'Extracted Document').replace(/\.[^/.]+$/, '');

    // Step 1: Standard high-performance text extraction via PDFParse
    try {
      const parsed = await extractTextFromPdfBuffer(buffer);
      extractedText = parsed.text;
      pageCount = parsed.pageCount || 1;
      if (parsed.title) {
        docTitle = parsed.title;
      }
    } catch (parseError: any) {
      console.warn('Direct PDF text extraction failed, checking multimodal fallback:', parseError?.message);
    }

    // Step 2: Gemini multimodal PDF fallback if text was empty (e.g. scanned/image PDF, complex vectors)
    if ((!extractedText || extractedText.length < 20) && aiClient) {
      try {
        console.log('Invoking Gemini 3.8 Flash multimodal PDF extraction fallback...');
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: cleanBase64,
                  },
                },
                {
                  text: 'Extract and transcribe all educational lecture notes, key terms, definitions, headings, and conceptual explanations from this PDF document. Present it in detailed, structured text suitable for creating study flashcards. Do not invent facts.',
                },
              ],
            },
          ],
        });

        const multimodalText = (response.text || '').trim();
        if (multimodalText.length > 20) {
          extractedText = multimodalText;
        }
      } catch (geminiError: any) {
        console.warn('Gemini multimodal PDF fallback error:', geminiError?.message);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({
        error: 'Could not extract readable text from this PDF. It may contain scanned image-only pages or encrypted contents. You can also paste notes directly in the "Paste Notes" tab.',
      });
    }

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    res.json({
      text: extractedText,
      pageCount,
      wordCount,
      title: docTitle,
    });
  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    res.status(500).json({
      error: `Failed to extract text from PDF: ${error.message || 'Unknown parsing error'}`,
    });
  }
});

// Large-Document Chunking endpoint
app.post('/api/chunk-document', (req, res) => {
  try {
    const { text, maxChunkSize, minChunkSize, overlap } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required for document chunking.' });
    }

    const chunkingResult = chunkDocument(text, {
      maxChunkSize: maxChunkSize ? parseInt(String(maxChunkSize), 10) : undefined,
      minChunkSize: minChunkSize ? parseInt(String(minChunkSize), 10) : undefined,
      overlap: overlap ? parseInt(String(overlap), 10) : undefined,
    });

    res.json(chunkingResult);
  } catch (error: any) {
    console.error('Document chunking failed:', error);
    res.status(500).json({ error: error.message || 'Failed to chunk document.' });
  }
});

// Flashcard Generation endpoint (supports single-section and multi-chunk generation)
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const {
      text,
      topic = 'General Notes',
      count = 8,
      difficulty = 'Medium',
      cardType = 'Mixed',
      language = 'English',
      chunks: requestedChunks,
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

    const cardCount = Math.min(Math.max(parseInt(String(count), 10) || 8, 3), 40);

    // Multi-chunk generation strategy for large documents
    let activeChunks: any[] = Array.isArray(requestedChunks) && requestedChunks.length > 0 ? requestedChunks : [];
    if (activeChunks.length === 0 && text.length > 5000) {
      const chunkResult = chunkDocument(text);
      if (chunkResult.isLargeDocument) {
        activeChunks = chunkResult.chunks;
      }
    }

    if (activeChunks.length > 1) {
      const distributed = distributeCardCounts(activeChunks, cardCount);
      console.log(`Processing large document across ${distributed.length} chunks...`);

      const chunkPromises = distributed.map(async (chunk) => {
        const chunkTarget = chunk.allocatedCardCount || 2;
        const chunkSystemPrompt = `You are FlashMind AI, an expert educational tutor specializing in high-retention flashcard synthesis for college and high school students.
Generate exactly ${chunkTarget} high-yield, distinct flashcards strictly based on this document section: "${chunk.title}".
Rules:
1. Ground every question and answer strictly in this section text. Do not invent facts.
2. Difficulty level: ${difficulty}.
3. Card type preference: ${cardType}.
4. Target language: ${language}.
5. Provide a brief 1-sentence memory hint/explanation for each card.`;

        const chunkUserPrompt = `TOPIC: ${topic}
SECTION: ${chunk.title}
CONTENT:
${chunk.content}

Generate ${chunkTarget} flashcards according to the rules.`;

        try {
          const chunkResponse = await aiClient!.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: chunkUserPrompt,
            config: {
              systemInstruction: chunkSystemPrompt,
              temperature: 0.35,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'answer'],
                },
              },
            },
          });

          const parsed = JSON.parse(chunkResponse.text?.trim() || '[]');
          return (Array.isArray(parsed) ? parsed : []).map((card: any) => ({
            ...card,
            section: chunk.title,
            subject: card.subject || topic,
            difficulty: card.difficulty || difficulty,
          }));
        } catch (err) {
          console.warn(`Chunk generation failed for section "${chunk.title}":`, err);
          return [];
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      const combinedCards = chunkResults.flat();
      const deduplicated = deduplicateAndRankCards(combinedCards);

      if (deduplicated.length > 0) {
        return res.json({
          cards: deduplicated,
          modelUsed: 'gemini-3.8-flash',
          topic,
          difficulty,
          isChunked: true,
          chunksProcessed: distributed.length,
        });
      }
      // If chunked failed to produce cards, fall through to single-shot below
    }

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
