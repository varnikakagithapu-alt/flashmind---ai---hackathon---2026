import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Generator } from './components/Generator';
import { DeckManager } from './components/DeckManager';
import { StudyMode } from './components/StudyMode';
import { QuizMode } from './components/QuizMode';
import { CardEditorModal } from './components/CardEditorModal';
import { Deck, StudyStats } from './types';
import { StorageService } from './services/storage';
import { AiService } from './services/ai';
import { Brain, Heart, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'create' | 'decks' | 'study' | 'quiz'>('dashboard');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStats>(StorageService.getStats());
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [deckBeingEdited, setDeckBeingEdited] = useState<Deck | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  // Load decks and health status
  useEffect(() => {
    const loadedDecks = StorageService.getDecks();
    setDecks(loadedDecks);
    setStats(StorageService.getStats());

    AiService.checkHealth().then((health) => {
      setHasGeminiKey(health.hasGeminiKey);
    });
  }, []);

  const refreshDecksAndStats = () => {
    setDecks(StorageService.getDecks());
    setStats(StorageService.getStats());
  };

  // Deck Actions
  const handleDeckCreated = (newDeck: Deck) => {
    const created = StorageService.createDeck(newDeck);
    refreshDecksAndStats();
    setActiveDeck(created);
    setCurrentTab('study');
  };

  const handleUpdateDeck = (updatedDeck: Deck) => {
    StorageService.updateDeck(updatedDeck.id, updatedDeck);
    refreshDecksAndStats();
    if (activeDeck?.id === updatedDeck.id) {
      setActiveDeck(updatedDeck);
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    StorageService.deleteDeck(deckId);
    refreshDecksAndStats();
    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
    }
  };

  const handleResetProgress = () => {
    StorageService.resetAllProgress();
    refreshDecksAndStats();
  };

  const handleCardStatusChange = (cardId: string, mastered: boolean) => {
    if (!activeDeck) return;
    StorageService.updateCard(activeDeck.id, cardId, {
      mastered,
      needsReview: !mastered,
      reviewCount: (activeDeck.cards.find((c) => c.id === cardId)?.reviewCount || 0) + 1,
    });
    refreshDecksAndStats();
  };

  const handleStudySessionComplete = (cardsStudied: number, masteredDelta: number) => {
    if (!activeDeck) return;
    StorageService.recordStudySession(cardsStudied, masteredDelta, activeDeck.title);
    refreshDecksAndStats();
  };

  const handleQuizCompleted = (scorePercentage: number, totalQuestions: number) => {
    if (!activeDeck) return;
    StorageService.recordQuizResult(activeDeck.title, totalQuestions, scorePercentage);
    refreshDecksAndStats();
  };

  const handleStartStudy = (deck: Deck) => {
    setActiveDeck(deck);
    setCurrentTab('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuiz = (deck: Deck) => {
    setActiveDeck(deck);
    setCurrentTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Universal Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'quiz' && !activeDeck) {
            if (decks.length > 0) setActiveDeck(decks[0]);
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasGeminiKey={hasGeminiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            decks={decks}
            stats={stats}
            onStartStudy={handleStartStudy}
            onStartQuiz={handleStartQuiz}
            onCreateNew={() => setCurrentTab('create')}
            onViewAllDecks={() => setCurrentTab('decks')}
            onSelectDeckForEdit={(deck) => setDeckBeingEdited(deck)}
            onResetProgress={handleResetProgress}
          />
        )}

        {currentTab === 'create' && (
          <Generator
            onDeckCreated={handleDeckCreated}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {currentTab === 'decks' && (
          <DeckManager
            decks={decks}
            onStartStudy={handleStartStudy}
            onStartQuiz={handleStartQuiz}
            onEditDeck={(deck) => setDeckBeingEdited(deck)}
            onDeleteDeck={handleDeleteDeck}
            onImportDeck={(imported) => {
              refreshDecksAndStats();
              setActiveDeck(imported);
            }}
            onCreateNew={() => setCurrentTab('create')}
          />
        )}

        {currentTab === 'study' && (
          activeDeck ? (
            <StudyMode
              deck={activeDeck}
              onBack={() => setCurrentTab('decks')}
              onCardStatusChange={handleCardStatusChange}
              onSessionComplete={handleStudySessionComplete}
              onStartQuiz={handleStartQuiz}
            />
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Select a Deck to Study</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Choose an existing deck or create a new set from notes.
              </p>
              <button
                onClick={() => setCurrentTab('decks')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Go to My Decks
              </button>
            </div>
          )
        )}

        {currentTab === 'quiz' && (
          activeDeck ? (
            <QuizMode
              deck={activeDeck}
              onBack={() => setCurrentTab('decks')}
              onQuizCompleted={handleQuizCompleted}
            />
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
              <Brain className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Select a Deck for Quiz</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Choose a flashcard deck to test your knowledge with multiple-choice questions.
              </p>
              <button
                onClick={() => setCurrentTab('decks')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Go to My Decks
              </button>
            </div>
          )
        )}
      </main>

      {/* Card Editor Modal */}
      {deckBeingEdited && (
        <CardEditorModal
          deck={deckBeingEdited}
          isOpen={Boolean(deckBeingEdited)}
          onClose={() => setDeckBeingEdited(null)}
          onSaveDeck={handleUpdateDeck}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">FlashMind AI</span>
            <span aria-hidden="true">·</span>
            <span>Turn your notes into smarter revision</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Spaced Repetition & Quiz Practice</span>
            <span aria-hidden="true">·</span>
            <span>Supports PDF, TXT & Anki Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
