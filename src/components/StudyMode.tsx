import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Volume2,
  Brain,
  ArrowLeft,
  Sparkles,
  Trophy,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';

interface StudyModeProps {
  deck: Deck;
  onBack: () => void;
  onCardStatusChange: (cardId: string, mastered: boolean) => void;
  onSessionComplete: (cardsStudied: number, masteredDelta: number) => void;
  onStartQuiz: (deck: Deck) => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({
  deck,
  onBack,
  onCardStatusChange,
  onSessionComplete,
  onStartQuiz,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(deck.cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{
    knowIt: string[];
    reviewAgain: string[];
  }>({
    knowIt: [],
    reviewAgain: [],
  });
  const [filterMode, setFilterMode] = useState<'all' | 'needsReview'>('all');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Initialize cards according to filter
  useEffect(() => {
    if (filterMode === 'needsReview') {
      const filtered = deck.cards.filter((c) => !c.mastered || c.needsReview);
      setCards(filtered.length > 0 ? filtered : deck.cards);
    } else {
      setCards(deck.cards);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [deck, filterMode]);

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Completed the deck
      triggerCompletion();
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const markCard = (knowIt: boolean) => {
    if (!currentCard) return;

    onCardStatusChange(currentCard.id, knowIt);

    setSessionResults((prev) => {
      const nextKnowIt = knowIt
        ? Array.from(new Set([...prev.knowIt, currentCard.id]))
        : prev.knowIt.filter((id) => id !== currentCard.id);
      const nextReview = !knowIt
        ? Array.from(new Set([...prev.reviewAgain, currentCard.id]))
        : prev.reviewAgain.filter((id) => id !== currentCard.id);
      return { knowIt: nextKnowIt, reviewAgain: nextReview };
    });

    handleNext();
  };

  const triggerCompletion = () => {
    setIsCompleted(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    const masteredDelta = sessionResults.knowIt.length;
    onSessionComplete(cards.length, masteredDelta);
  };

  // Web Speech API for reading card out loud
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyK' || e.code === 'Digit1') {
        e.preventDefault();
        markCard(true);
      } else if (e.code === 'KeyR' || e.code === 'Digit2') {
        e.preventDefault();
        markCard(false);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, markCard]);

  if (!currentCard && !isCompleted) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No cards in this deck</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Add flashcards to begin studying.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Decks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Deck Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Decks</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-slate-900 truncate max-w-xs md:max-w-md">
            {deck.title}
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{deck.subject}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Card {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            title="Shuffle cards (Key: S)"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartQuiz(deck)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Switch to Quiz</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Cards ({deck.cards.length})
          </button>
          <button
            onClick={() => setFilterMode('needsReview')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterMode === 'needsReview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Review ({deck.cards.filter((c) => !c.mastered || c.needsReview).length})
          </button>
        </div>

        <div className="text-slate-400 hidden sm:flex items-center gap-3 text-[11px]">
          <span>Space: Flip</span>
          <span>← / →: Prev / Next</span>
          <span>1 / K: Know it</span>
          <span>2 / R: Review</span>
        </div>
      </div>

      {/* Interactive Flashcard 3D Stage */}
      {!isCompleted ? (
        <div className="space-y-6">
          <div
            onClick={handleFlip}
            className="w-full min-h-[360px] md:min-h-[420px] perspective-1000 cursor-pointer select-none group"
          >
            <div
              className={`relative w-full h-full min-h-[360px] md:min-h-[420px] rounded-2xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-lg ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front of Card (Question) */}
              <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl p-8 md:p-12 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-indigo-600">
                      Question / Term
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{currentCard.difficulty || 'Medium'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(currentCard.question);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Read Question"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto py-6 text-center">
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-semibold text-slate-900 leading-snug">
                    {currentCard.question}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Click anywhere or tap Space to reveal answer</span>
                  <span className="text-indigo-600 font-medium group-hover:underline">Flip Card →</span>
                </div>
              </div>

              {/* Back of Card (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 md:p-12 flex flex-col justify-between border border-slate-800">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-emerald-400">
                      Answer / Explanation
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{currentCard.subject || deck.subject}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(currentCard.answer);
                    }}
                    className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Read Answer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto py-6 text-center space-y-4">
                  <p className="text-lg md:text-xl lg:text-2xl font-sans font-medium text-slate-100 leading-relaxed">
                    {currentCard.answer}
                  </p>
                  {currentCard.explanation && (
                    <div className="max-w-md mx-auto p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-indigo-200/90 leading-relaxed text-left">
                      <span className="font-semibold text-white mr-1.5">Key Tip:</span>
                      {currentCard.explanation}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-300/80 pt-4 border-t border-white/10">
                  <span>Click to flip back to question</span>
                  <span className="text-indigo-200">Rate your recall below</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Prev */}
            <div className="sm:col-span-3 flex items-center justify-start">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            </div>

            {/* Assessment Feedback Buttons: Review Again vs Know It */}
            <div className="sm:col-span-6 flex items-center justify-center gap-3">
              <button
                onClick={() => markCard(false)}
                className="flex-1 max-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Review Again</span>
              </button>

              <button
                onClick={() => markCard(true)}
                className="flex-1 max-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Know It!</span>
              </button>
            </div>

            {/* Next */}
            <div className="sm:col-span-3 flex items-center justify-end">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{currentIndex === cards.length - 1 ? 'Finish Deck' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completion Celebration Screen */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center shadow-lg space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-slate-900">
              Deck Review Completed!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Great session! Active retrieval practice strengthens synaptic connections and boosts long-term retention.
            </p>
          </div>

          {/* Results Summary Strip */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-emerald-700 tabular-nums">
                {sessionResults.knowIt.length}
              </div>
              <div className="text-xs text-emerald-800 font-medium mt-1">Mastered (Know It)</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-display font-bold text-amber-700 tabular-nums">
                {sessionResults.reviewAgain.length}
              </div>
              <div className="text-xs text-amber-800 font-medium mt-1">Needs Review</div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsCompleted(false);
                setSessionResults({ knowIt: [], reviewAgain: [] });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart All Cards</span>
            </button>

            <button
              onClick={() => onStartQuiz(deck)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Test Knowledge via Quiz</span>
            </button>

            <button
              onClick={onBack}
              className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
