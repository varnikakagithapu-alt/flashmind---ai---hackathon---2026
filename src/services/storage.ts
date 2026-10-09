import { Deck, Flashcard, StudyStats, ActivityEntry, DailyTrendPoint } from '../types';

const DECKS_STORAGE_KEY = 'flashmind_decks_v1';
const STATS_STORAGE_KEY = 'flashmind_stats_v1';

export const SEED_DECKS: Deck[] = [
  {
    id: 'seed-deck-biology-1',
    title: 'Cellular Biology: Organelles & Energy',
    description: 'Essential eukaryotic cell organelles, mitochondrial ATP synthesis, and DNA replication mechanisms for midterm revision.',
    subject: 'Biology 101',
    difficulty: 'Medium',
    coverImage: '/src/assets/images/deck_cover_biology_1791549792508.jpg',
    tags: ['Biology', 'Cells', 'Genetics', 'Exams'],
    sourceDocumentName: 'Campbell_Biology_Ch6_Notes.pdf',
    isGeneratedByAI: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    cards: [
      {
        id: 'card-bio-1',
        question: 'What is the primary function of the mitochondrion in eukaryotic cells?',
        answer: 'Generates most of the chemical energy needed to power the cell’s biochemical reactions through cellular respiration, producing ATP.',
        subject: 'Cellular Biology',
        difficulty: 'Easy',
        explanation: 'Often called the powerhouse of the cell; produces adenosine triphosphate (ATP) via the citric acid cycle and oxidative phosphorylation.',
        mastered: true,
        reviewCount: 3,
        lastReviewed: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'card-bio-2',
        question: 'Define the function of the rough endoplasmic reticulum (Rough ER).',
        answer: 'Synthesizes and folds proteins destined for membranes or secretion, studded with ribosomes on its cytosolic face.',
        subject: 'Cellular Biology',
        difficulty: 'Medium',
        explanation: 'Rough ER has ribosomes attached; smooth ER synthesizes lipids and metabolizes carbohydrates.',
        mastered: false,
        needsReview: true,
        reviewCount: 2,
        lastReviewed: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'card-bio-3',
        question: 'What enzyme unwinds the DNA double helix during replication fork formation?',
        answer: 'DNA Helicase breaks the hydrogen bonds between nitrogenous base pairs.',
        subject: 'Genetics',
        difficulty: 'Medium',
        explanation: 'Helicase separates the two complementary strands at the origin of replication.',
        mastered: true,
        reviewCount: 4,
        lastReviewed: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'card-bio-4',
        question: 'What role do Okazaki fragments play in DNA synthesis?',
        answer: 'Short segments of newly synthesized DNA on the lagging strand that are later joined together by DNA ligase.',
        subject: 'Genetics',
        difficulty: 'Hard',
        explanation: 'DNA polymerase can only synthesize in the 5’ to 3’ direction, forcing discontinuous lagging strand synthesis.',
        mastered: false,
        reviewCount: 1,
      },
      {
        id: 'card-bio-5',
        question: 'What is the endosymbiotic theory?',
        answer: 'The evolutionary theory stating that eukaryotic organelles (mitochondria and chloroplasts) originated as free-living prokaryotic microbes engulfed by ancestral cells.',
        subject: 'Evolution & Cell Biology',
        difficulty: 'Hard',
        explanation: 'Evidenced by their double membranes, circular DNA genomes, and 70S ribosomes.',
        mastered: false,
        reviewCount: 0,
      },
      {
        id: 'card-bio-6',
        question: 'What is the function of the Golgi apparatus?',
        answer: 'Modifies, sorts, and packages macromolecules (especially proteins and lipids) synthesized in the ER for delivery to cellular destinations or secretion.',
        subject: 'Cellular Biology',
        difficulty: 'Easy',
        explanation: 'Composed of flattened membranous sacs called cisternae with cis (entry) and trans (exit) faces.',
        mastered: true,
        reviewCount: 2,
      },
    ],
  },
  {
    id: 'seed-deck-cs-2',
    title: 'Computer Science: Algorithms & Complexity',
    description: 'Fundamental asymptotic analysis, search algorithms, balanced trees, and dynamic programming paradigms.',
    subject: 'Computer Science',
    difficulty: 'Hard',
    tags: ['Algorithms', 'Data Structures', 'Big-O', 'Coding'],
    sourceDocumentName: 'Algorithms_Lecture_Notes_Week4.txt',
    isGeneratedByAI: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    cards: [
      {
        id: 'card-cs-1',
        question: 'What is the worst-case time complexity of QuickSort and how can it be mitigated?',
        answer: 'O(n²) time complexity occurs when the chosen pivot is repeatedly the extreme element. Mitigated using randomized pivot selection or the median-of-three rule.',
        subject: 'Sorting Algorithms',
        difficulty: 'Medium',
        explanation: 'Average case time complexity remains O(n log n).',
        mastered: false,
        reviewCount: 1,
      },
      {
        id: 'card-cs-2',
        question: 'What is the primary condition required to execute Binary Search on an array?',
        answer: 'The collection or array must already be sorted in monotonic order (ascending or descending).',
        subject: 'Search Algorithms',
        difficulty: 'Easy',
        explanation: 'Allows discarding half the search interval in O(1) time per step, achieving O(log n) total runtime.',
        mastered: true,
        reviewCount: 5,
        lastReviewed: new Date().toISOString(),
      },
      {
        id: 'card-cs-3',
        question: 'Define the two core characteristics of problems solvable via Dynamic Programming.',
        answer: '1. Overlapping Subproblems: subproblems recur multiple times. 2. Optimal Substructure: optimal solution can be constructed from optimal solutions to subproblems.',
        subject: 'Algorithmic Paradigms',
        difficulty: 'Hard',
        explanation: 'Memoization (top-down) or tabulation (bottom-up) stores intermediate subproblem results.',
        mastered: false,
        needsReview: true,
        reviewCount: 2,
      },
      {
        id: 'card-cs-4',
        question: 'What is the time complexity of lookup, insertion, and deletion in a balanced Binary Search Tree (AVL or Red-Black)?',
        answer: 'O(log n) worst-case time complexity across search, insert, and delete operations.',
        subject: 'Data Structures',
        difficulty: 'Medium',
        explanation: 'Height self-balancing keeps the tree height strictly bounded by O(log n).',
        mastered: true,
        reviewCount: 3,
      },
    ],
  },
  {
    id: 'seed-deck-psych-3',
    title: 'Cognitive Psychology: Memory Models',
    description: 'Atkinson-Shiffrin multi-store model, Baddeley working memory components, and retrieval failure phenomena.',
    subject: 'Psychology',
    difficulty: 'Medium',
    tags: ['Psychology', 'Memory', 'Neuroscience'],
    sourceDocumentName: 'Intro_Psych_Ch7_Notes.txt',
    isGeneratedByAI: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    cards: [
      {
        id: 'card-psy-1',
        question: 'What are the three components of Baddeley and Hitch’s working memory model?',
        answer: '1. Central Executive, 2. Phonological Loop (inner ear/voice), 3. Visuospatial Sketchpad (inner eye) — later joined by the Episodic Buffer.',
        subject: 'Cognitive Models',
        difficulty: 'Medium',
        explanation: 'Distinguishes active manipulation of information from passive short-term storage.',
        mastered: true,
        reviewCount: 2,
      },
      {
        id: 'card-psy-2',
        question: 'Explain the difference between proactive and retroactive interference in memory.',
        answer: 'Proactive: old memories hinder retention of new info. Retroactive: newly learned info disrupts recall of previously stored memories.',
        subject: 'Forgetting Mechanisms',
        difficulty: 'Hard',
        explanation: 'Pro = forward in time disruption; Retro = backward in time disruption.',
        mastered: false,
        needsReview: true,
        reviewCount: 1,
      },
      {
        id: 'card-psy-3',
        question: 'What is the Testing Effect (retrieval practice effect)?',
        answer: 'The empirical finding that actively retrieving information from memory produces superior long-term retention compared to passive re-reading.',
        subject: 'Learning Science',
        difficulty: 'Easy',
        explanation: 'Flashcards and low-stakes quizzing are direct applications of the testing effect.',
        mastered: true,
        reviewCount: 4,
      },
    ],
  },
];

function generateDefaultTrends(): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];
  const baseMastered = [3, 4, 2, 5, 3, 6, 4];
  const baseStudied = [8, 10, 6, 12, 9, 14, 11];
  const baseMinutes = [12, 16, 9, 18, 14, 22, 17];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
    const idx = 6 - i;
    points.push({
      date: dateLabel,
      cardsMastered: baseMastered[idx],
      cardsStudied: baseStudied[idx],
      studyMinutes: baseMinutes[idx],
    });
  }
  return points;
}

const INITIAL_STATS: StudyStats = {
  totalCardsStudied: 28,
  totalCardsMastered: 11,
  totalStudyMinutes: 52,
  studyStreakDays: 3,
  lastStudyDate: new Date().toISOString(),
  dailyTrends: generateDefaultTrends(),
  activities: [
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      type: 'study',
      deckTitle: 'Cellular Biology: Organelles & Energy',
      cardsCount: 6,
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'quiz',
      deckTitle: 'Computer Science: Algorithms & Complexity',
      cardsCount: 4,
      score: 100,
    },
  ],
};

export const StorageService = {
  getDecks(): Deck[] {
    try {
      const data = localStorage.getItem(DECKS_STORAGE_KEY);
      if (!data) {
        this.saveDecks(SEED_DECKS);
        return SEED_DECKS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return SEED_DECKS;
    } catch (e) {
      console.warn('Failed to parse saved decks, restoring seed decks', e);
      return SEED_DECKS;
    }
  },

  saveDecks(decks: Deck[]): void {
    try {
      localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error('Error saving decks to localStorage:', e);
    }
  },

  getDeckById(id: string): Deck | undefined {
    const decks = this.getDecks();
    return decks.find((d) => d.id === id);
  },

  createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Deck {
    const decks = this.getDecks();
    const newDeck: Deck = {
      ...deck,
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    decks.unshift(newDeck);
    this.saveDecks(decks);

    this.recordActivity({
      type: 'create',
      deckTitle: newDeck.title,
      cardsCount: newDeck.cards.length,
    });

    return newDeck;
  },

  updateDeck(id: string, updates: Partial<Deck>): Deck | null {
    const decks = this.getDecks();
    const index = decks.findIndex((d) => d.id === id);
    if (index === -1) return null;

    decks[index] = {
      ...decks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveDecks(decks);
    return decks[index];
  },

  deleteDeck(id: string): boolean {
    const decks = this.getDecks();
    const filtered = decks.filter((d) => d.id !== id);
    if (filtered.length !== decks.length) {
      this.saveDecks(filtered);
      return true;
    }
    return false;
  },

  updateCard(deckId: string, cardId: string, updates: Partial<Flashcard>): Deck | null {
    const decks = this.getDecks();
    const deckIndex = decks.findIndex((d) => d.id === deckId);
    if (deckIndex === -1) return null;

    const cardIndex = decks[deckIndex].cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return null;

    decks[deckIndex].cards[cardIndex] = {
      ...decks[deckIndex].cards[cardIndex],
      ...updates,
      lastReviewed: new Date().toISOString(),
    };
    decks[deckIndex].updatedAt = new Date().toISOString();
    this.saveDecks(decks);
    return decks[deckIndex];
  },

  getStats(): StudyStats {
    try {
      const data = localStorage.getItem(STATS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(INITIAL_STATS));
        return INITIAL_STATS;
      }
      const parsed = JSON.parse(data);
      if (!parsed.dailyTrends || !Array.isArray(parsed.dailyTrends) || parsed.dailyTrends.length === 0) {
        parsed.dailyTrends = generateDefaultTrends();
      }
      if (typeof parsed.totalStudyMinutes !== 'number') {
        parsed.totalStudyMinutes = Math.round(parsed.totalCardsStudied * 1.5) || 52;
      }
      return parsed;
    } catch {
      return INITIAL_STATS;
    }
  },

  saveStats(stats: StudyStats): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving study stats:', e);
    }
  },

  recordStudySession(cardsStudied: number, masteredDelta: number, deckTitle: string): void {
    const stats = this.getStats();
    const today = new Date().toDateString();
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : '';

    let streak = stats.studyStreakDays;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastDate === yesterday) {
        streak += 1;
      } else if (!lastDate) {
        streak = 1;
      } else {
        streak = 1;
      }
    }

    const sessionMinutes = Math.max(2, Math.round(cardsStudied * 1.5));
    const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

    // Update dailyTrends: update today or append
    const trends = [...stats.dailyTrends];
    const lastTrend = trends[trends.length - 1];
    if (lastTrend && lastTrend.date === todayLabel) {
      lastTrend.cardsStudied += cardsStudied;
      lastTrend.cardsMastered += Math.max(0, masteredDelta);
      lastTrend.studyMinutes += sessionMinutes;
    } else {
      trends.push({
        date: todayLabel,
        cardsStudied,
        cardsMastered: Math.max(0, masteredDelta),
        studyMinutes: sessionMinutes,
      });
      if (trends.length > 7) trends.shift();
    }

    const updatedStats: StudyStats = {
      totalCardsStudied: stats.totalCardsStudied + cardsStudied,
      totalCardsMastered: Math.max(0, stats.totalCardsMastered + masteredDelta),
      totalStudyMinutes: (stats.totalStudyMinutes || 0) + sessionMinutes,
      studyStreakDays: streak,
      lastStudyDate: new Date().toISOString(),
      dailyTrends: trends,
      activities: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'study',
          deckTitle,
          cardsCount: cardsStudied,
        },
        ...stats.activities.slice(0, 19),
      ],
    };

    this.saveStats(updatedStats);
  },

  recordQuizResult(deckTitle: string, totalQuestions: number, scorePercentage: number): void {
    const stats = this.getStats();
    const sessionMinutes = Math.max(2, Math.round(totalQuestions * 1.2));
    const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

    const trends = [...stats.dailyTrends];
    const lastTrend = trends[trends.length - 1];
    if (lastTrend && lastTrend.date === todayLabel) {
      lastTrend.cardsStudied += totalQuestions;
      lastTrend.studyMinutes += sessionMinutes;
    } else {
      trends.push({
        date: todayLabel,
        cardsStudied: totalQuestions,
        cardsMastered: Math.round(totalQuestions * (scorePercentage / 100)),
        studyMinutes: sessionMinutes,
      });
      if (trends.length > 7) trends.shift();
    }

    const updatedStats: StudyStats = {
      ...stats,
      totalCardsStudied: stats.totalCardsStudied + totalQuestions,
      totalStudyMinutes: (stats.totalStudyMinutes || 0) + sessionMinutes,
      lastStudyDate: new Date().toISOString(),
      dailyTrends: trends,
      activities: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'quiz',
          deckTitle,
          cardsCount: totalQuestions,
          score: scorePercentage,
        },
        ...stats.activities.slice(0, 19),
      ],
    };
    this.saveStats(updatedStats);
  },

  recordActivity(activity: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
    const stats = this.getStats();
    const updated: StudyStats = {
      ...stats,
      activities: [
        {
          ...activity,
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        ...stats.activities.slice(0, 19),
      ],
    };
    this.saveStats(updated);
  },

  exportDeckAsJson(deck: Deck): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportDeckAsAnki(deck: Deck): void {
    // Standard TSV format for Anki: Front \t Back \t Tags
    const lines = deck.cards.map((card) => {
      const front = card.question.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const back = card.answer.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const tags = (deck.tags || []).join(' ');
      return `${front}\t${back}\t${tags}`;
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_anki.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  },

  importDeckFromJson(jsonString: string): Deck {
    const parsed = JSON.parse(jsonString);
    if (!parsed.title || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid flashcard deck format. Missing title or cards array.');
    }

    const validatedCards: Flashcard[] = parsed.cards.map((c: any, index: number) => {
      if (!c.question || !c.answer) {
        throw new Error(`Card #${index + 1} is missing a question or answer.`);
      }
      return {
        id: c.id || `card-${Date.now()}-${index}`,
        question: String(c.question),
        answer: String(c.answer),
        subject: c.subject || parsed.subject || 'General',
        difficulty: c.difficulty || 'Medium',
        explanation: c.explanation || '',
        mastered: Boolean(c.mastered),
        needsReview: Boolean(c.needsReview),
      };
    });

    return this.createDeck({
      title: `${parsed.title} (Imported)`,
      description: parsed.description || 'Imported flashcard deck',
      subject: parsed.subject || 'General',
      difficulty: parsed.difficulty || 'Medium',
      cards: validatedCards,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['Imported'],
      isGeneratedByAI: Boolean(parsed.isGeneratedByAI),
    });
  },
};
