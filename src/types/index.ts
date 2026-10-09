export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type CardTypeOption = 'Question and Answer' | 'Definition' | 'Mixed';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  difficulty?: DifficultyLevel;
  explanation?: string;
  mastered?: boolean;
  needsReview?: boolean;
  reviewCount?: number;
  lastReviewed?: string;
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
  cardsMastered: number;
  cardsStudied: number;
  studyMinutes: number;
}

export interface StudyStats {
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
