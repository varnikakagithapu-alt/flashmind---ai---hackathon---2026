import { DifficultyLevel, CardTypeOption, Flashcard, QuizQuestion } from '../types';

export interface GenerationParams {
  text: string;
  topic: string;
  count: number;
  difficulty: DifficultyLevel;
  cardType: CardTypeOption;
  language: string;
}

export interface GenerationResult {
  cards: Omit<Flashcard, 'id'>[];
  source: 'gemini' | 'local-extractive';
  modelUsed?: string;
}

export const AiService = {
  async checkHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check non-ok');
      return await res.json();
    } catch {
      return { status: 'offline', hasGeminiKey: false };
    }
  },

  async extractPdf(file: File): Promise<{ text: string; pageCount: number; wordCount: number; title: string }> {
    return new Promise((resolve, reject) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return reject(new Error('Selected file is not a PDF document.'));
      }

      if (file.size > 20 * 1024 * 1024) {
        return reject(new Error('PDF file size exceeds 20MB limit.'));
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, filename: file.name }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to extract text from PDF.');
          }

          resolve({
            text: data.text,
            pageCount: data.pageCount || 1,
            wordCount: data.wordCount || data.text.split(/\s+/).filter(Boolean).length,
            title: data.title || file.name.replace(/\.[^/.]+$/, ''),
          });
        } catch (err: any) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read the PDF file from disk.'));
      reader.readAsDataURL(file);
    });
  },

  async extractTxt(file: File): Promise<{ text: string; wordCount: number; title: string }> {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        return reject(new Error('Text file size exceeds 5MB limit.'));
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string || '').trim();
        if (!text) {
          return reject(new Error('The uploaded text file is empty.'));
        }
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        resolve({
          text,
          wordCount,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      };
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  },

  async generateFlashcards(params: GenerationParams): Promise<GenerationResult> {
    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.cards) && data.cards.length > 0) {
          return {
            cards: data.cards.map((c: any) => ({
              question: c.question,
              answer: c.answer,
              subject: c.subject || params.topic,
              difficulty: (c.difficulty as DifficultyLevel) || params.difficulty,
              explanation: c.explanation || '',
            })),
            source: 'gemini',
            modelUsed: data.modelUsed || 'gemini-3.8-flash',
          };
        }
      }

      // Check if backend specifically required fallback or failed
      const errData = await response.json().catch(() => ({}));
      console.warn('Backend generation response not ok, invoking local extractor:', errData);
    } catch (err) {
      console.warn('Network or server error during Gemini flashcard generation:', err);
    }

    // Local extractive fallback (guarantees functionality without API key or when offline)
    const localCards = this.extractLocalFlashcards(params.text, params.topic, params.count, params.difficulty);
    return {
      cards: localCards,
      source: 'local-extractive',
    };
  },

  extractLocalFlashcards(
    rawText: string,
    topic: string,
    targetCount: number,
    difficulty: DifficultyLevel
  ): Omit<Flashcard, 'id'>[] {
    const clean = rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ');
    const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 30);
    const sentences = clean
      .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && s.length < 300);

    const cards: Omit<Flashcard, 'id'>[] = [];
    const usedQuestions = new Set<string>();

    // Strategy 1: Definition markers (e.g. "X is defined as Y", "X refers to Y", "X is a Y", "X consists of Y")
    const definitionPatterns = [
      /^([A-Z][a-zA-Z0-9\s-]{2,35})\s+(?:is defined as|refers to|is denoted by|describes)\s+(.+)$/i,
      /^([A-Z][a-zA-Z0-9\s-]{2,35})\s+(?:is an?|are)\s+(.+)$/i,
      /^([A-Z][a-zA-Z0-9\s-]{2,35}):\s+(.+)$/,
      /^([A-Z][a-zA-Z0-9\s-]{2,35})\s*[-–—]\s*(.+)$/,
      /^The (?:primary|main|core)?\s*(?:role|function|purpose) of\s+([a-zA-Z0-9\s-]{2,35})\s+is\s+(.+)$/i,
    ];

    for (const sentence of sentences) {
      if (cards.length >= targetCount) break;

      for (const pattern of definitionPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          const term = match[1].trim();
          const definition = match[2].trim();

          if (term.length >= 3 && term.length <= 40 && definition.length >= 15) {
            const question = `What is ${term}?`;
            if (!usedQuestions.has(question.toLowerCase())) {
              usedQuestions.add(question.toLowerCase());
              cards.push({
                question,
                answer: definition.endsWith('.') ? definition : `${definition}.`,
                subject: topic || 'Core Notes',
                difficulty,
                explanation: `Extracted directly from study notes: "${sentence.slice(0, 100)}..."`,
              });
              break;
            }
          }
        }
      }
    }

    // Strategy 2: Key concept questions from substantial paragraphs
    if (cards.length < targetCount) {
      for (const para of paragraphs) {
        if (cards.length >= targetCount) break;
        const paraSentences = para.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20);
        if (paraSentences.length >= 2) {
          const leadSentence = paraSentences[0].trim();
          const bodySentence = paraSentences.slice(1, 3).join(' ').trim();

          // Check if lead sentence contains a subject
          const words = leadSentence.split(/\s+/);
          if (words.length >= 4 && words.length <= 20) {
            const question = leadSentence.endsWith('?')
              ? leadSentence
              : `Explain the concept: "${leadSentence.replace(/\.$/, '')}"`;

            if (!usedQuestions.has(question.toLowerCase())) {
              usedQuestions.add(question.toLowerCase());
              cards.push({
                question,
                answer: bodySentence || leadSentence,
                subject: topic || 'Notes',
                difficulty,
                explanation: `Derived from notes section covering "${leadSentence.slice(0, 50)}..."`,
              });
            }
          }
        }
      }
    }

    // Strategy 3: Fill remaining slots with key sentences transformed into cloze / prompt questions
    if (cards.length < targetCount && sentences.length > 0) {
      for (const sentence of sentences) {
        if (cards.length >= targetCount) break;
        const words = sentence.split(/\s+/);
        if (words.length >= 6 && words.length <= 25) {
          const question = `Review this principle: ${words.slice(0, 4).join(' ')}...`;
          if (!usedQuestions.has(question.toLowerCase())) {
            usedQuestions.add(question.toLowerCase());
            cards.push({
              question,
              answer: sentence,
              subject: topic || 'Key Concept',
              difficulty,
              explanation: 'Direct excerpt from study material.',
            });
          }
        }
      }
    }

    return cards;
  },

  async generateQuiz(cards: Flashcard[], topic: string): Promise<QuizQuestion[]> {
    if (cards.length < 2) return [];

    // Attempt Gemini AI generated quiz first
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, topic }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length >= 2) {
          return data.questions.map((q: any, i: number) => ({
            id: `quiz-q-${i}`,
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation || 'Based on source flashcard.',
          }));
        }
      }
    } catch (e) {
      console.warn('API quiz generation unavailable, using smart local distractor engine:', e);
    }

    // Fallback: Smart local distractor generator using other cards from the deck
    return this.generateLocalQuiz(cards);
  },

  generateLocalQuiz(cards: Flashcard[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const pool = [...cards].sort(() => 0.5 - Math.random());

    for (let i = 0; i < pool.length; i++) {
      const current = pool[i];
      const correctAnswer = current.answer;

      // Select 3 distractors from other cards
      const otherCards = pool.filter((c) => c.id !== current.id);
      let distractors: string[] = [];

      // Prefer answers from other cards
      if (otherCards.length >= 3) {
        const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
        distractors = shuffledOthers.slice(0, 3).map((c) => c.answer);
      } else {
        // Fallback distractors if deck has fewer than 4 cards
        const genericDistractors = [
          'It is an inactive byproduct that does not take part in the biochemical process.',
          'It functions in reverse order to balance entropy within the system.',
          'It is exclusively found in non-living matter and exhibits inert behavior.',
        ];
        distractors = otherCards.map((c) => c.answer);
        while (distractors.length < 3) {
          distractors.push(genericDistractors[distractors.length]);
        }
      }

      // Combine and shuffle options
      const options = [correctAnswer, ...distractors].slice(0, 4);
      // Fisher-Yates shuffle
      for (let j = options.length - 1; j > 0; j--) {
        const rand = Math.floor(Math.random() * (j + 1));
        [options[j], options[rand]] = [options[rand], options[j]];
      }

      const correctIndex = options.indexOf(correctAnswer);

      questions.push({
        id: `local-quiz-q-${i}`,
        cardId: current.id,
        question: current.question,
        options,
        correctAnswerIndex: correctIndex,
        explanation: current.explanation || `Correct Answer: ${correctAnswer}`,
      });
    }

    return questions;
  },
};
