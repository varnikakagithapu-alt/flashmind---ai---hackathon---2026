export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type CardTypeOption = 'Question and Answer' | 'Definition' | 'Mixed';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  section?: string;
  difficulty?: DifficultyLevel;
  explanation?: string;
  mastered?: boolean;
  needsReview?: boolean;
  reviewCount?: number;
  lastReviewed?: string;
}

export interface DocumentChunk {
  id: string;
  index: number;
  title: string;
  content: string;
  wordCount: number;
  charCount: number;
  estimatedReadingTimeMinutes: number;
  allocatedCardCount?: number;
  pageRange?: { start: number; end: number };
}

export interface ChunkingOptions {
  maxChunkSize?: number;
  minChunkSize?: number;
  overlap?: number;
  preserveHeadings?: boolean;
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  totalWords: number;
  totalChars: number;
  isLargeDocument: boolean;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: DifficultyLevel;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  tags: string[];
  sourceDocumentName?: string;
  isGeneratedByAI: boolean;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: 'study' | 'quiz' | 'create';
  deckTitle: string;
  cardsCount: number;
  score?: number;
}

export interface DailyTrendPoint {
  date: string;
  dateKey?: string;
  cardsMastered: number;
  cardsStudied: number;
  studyMinutes: number;
}

export interface StudyStats {
  startDate?: string;
  totalCardsStudied: number;
  totalCardsMastered: number;
  totalStudyMinutes: number;
  studyStreakDays: number;
  lastStudyDate: string;
  activities: ActivityEntry[];
  dailyTrends: DailyTrendPoint[];
}

export interface QuizQuestion {
  id: string;
  cardId?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  selectedAnswerIndex?: number;
  isCorrect?: boolean;
}

export interface GenerationConfig {
  topic: string;
  count: number;
  difficulty: DifficultyLevel;
  cardType: CardTypeOption;
  language: string;
}
