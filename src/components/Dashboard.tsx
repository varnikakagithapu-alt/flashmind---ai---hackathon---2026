import React from 'react';
import {
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  Brain,
  Clock,
  ArrowRight,
  Upload,
  Play,
  RotateCw,
  FolderOpen,
} from 'lucide-react';
import { Deck, StudyStats } from '../types';
import { StudyTrendsChart } from './StudyTrendsChart';
import { StreakCalendar } from './StreakCalendar';

interface DashboardProps {
  decks: Deck[];
  stats: StudyStats;
  onStartStudy: (deck: Deck) => void;
  onStartQuiz: (deck: Deck) => void;
  onCreateNew: () => void;
  onViewAllDecks: () => void;
  onSelectDeckForEdit: (deck: Deck) => void;
  onResetProgress?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  decks,
  stats,
  onStartStudy,
  onStartQuiz,
  onCreateNew,
  onViewAllDecks,
  onSelectDeckForEdit,
  onResetProgress,
}) => {
  const [showResetModal, setShowResetModal] = React.useState(false);

  const totalCardsInDecks = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const masteredCount = decks.reduce(
    (acc, d) => acc + d.cards.filter((c) => c.mastered).length,
    0
  );

  const recentDecks = decks.slice(0, 4);

  const trackingDateLabel = stats.startDate
    ? new Date(stats.startDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[340px]">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between z-10">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-300">
                <span>College Exam & Revision Companion</span>
                <span aria-hidden="true">·</span>
                <span>AI Grounded</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white leading-tight">
                Turn your notes into <span className="text-indigo-400">smarter revision</span>.
              </h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                Upload lecture PDFs, textbooks, or paste seminar notes. FlashMind AI synthesizes
                high-yield flashcards with spaced repetition and quiz practice so you retain more in less time.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Flashcards</span>
              </button>
              <button
                onClick={onViewAllDecks}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Browse All Decks</span>
              </button>
            </div>
          </div>

          {/* Hero Right Visual with Fallback */}
          <div className="lg:col-span-5 relative hidden lg:block overflow-hidden">
            <img
              src="/src/assets/images/hero_flashmind_study_1791549777440.jpg"
              alt="University study workspace with flashcards and notes"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Graceful fallback container if file path is missing
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Tracking Status & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 -mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Real Study Activity
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">
            Tracking active since {trackingDateLabel}
          </span>
        </div>

        {onResetProgress && (
          <button
            onClick={() => setShowResetModal(true)}
            className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto font-medium"
            title="Clear all recorded study sessions and restart tracking from zero"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset All Records</span>
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Decks</span>
            <FolderOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl md:text-3xl font-display font-bold text-slate-900 tabular-nums">
            {decks.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalCardsInDecks} total cards generated
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Cards Studied</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-display font-bold text-slate-900 tabular-nums">
            {stats.totalCardsStudied}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across all review sessions
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Mastered Cards</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-display font-bold text-slate-900 tabular-nums">
            {masteredCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalCardsInDecks > 0
              ? `${Math.round((masteredCount / totalCardsInDecks) * 100)}% of your library`
              : 'Start learning'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-display font-bold text-slate-900 tabular-nums">
            {stats.studyStreakDays} <span className="text-sm font-normal text-slate-500">days</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Keep the daily momentum going
          </div>
        </div>
      </section>

      {/* Recharts Study Trends Section */}
      <StudyTrendsChart
        dailyTrends={stats.dailyTrends}
        totalStudyMinutes={stats.totalStudyMinutes}
        totalCardsMastered={stats.totalCardsMastered}
      />

      {/* Main Split: Recent Decks + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Decks to Study */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">
                Recent Study Decks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick up right where you left off or test your knowledge
              </p>
            </div>
            <button
              onClick={onViewAllDecks}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({decks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDecks.map((deck) => {
              const masteredInDeck = deck.cards.filter((c) => c.mastered).length;
              const masteryPercent =
                deck.cards.length > 0 ? Math.round((masteredInDeck / deck.cards.length) * 100) : 0;

              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Unboxed Metadata row */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-medium text-indigo-700">{deck.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{deck.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{deck.cards.length} cards</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1 mb-1">
                      {deck.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {deck.description}
                    </p>

                    {/* Mastery progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Mastery Progress</span>
                        <span className="font-medium text-slate-700 tabular-nums">
                          {masteryPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${masteryPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onStartStudy(deck)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-indigo-700" />
                      <span>Study Cards</span>
                    </button>
                    <button
                      onClick={() => onStartQuiz(deck)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Quiz Mode</span>
                    </button>
                    <button
                      onClick={() => onSelectDeckForEdit(deck)}
                      title="Edit deck cards"
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {decks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 p-8">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No flashcard decks yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Upload your class PDF notes or paste your lecture transcript to generate your first deck.
              </p>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Flashcards
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Launch & Study Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visual Streak Calendar */}
          <StreakCalendar stats={stats} />

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={onCreateNew}
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Upload PDF or Notes</div>
                  <div className="text-[11px] text-slate-500">Extract & generate cards</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (recentDecks.length > 0) onStartQuiz(recentDecks[0]);
                  else onCreateNew();
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Quick Practice Quiz</div>
                  <div className="text-[11px] text-slate-500">Test recall with 4-choice questions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {stats.activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium truncate">
                      {act.type === 'study' && `Studied ${act.cardsCount} cards in `}
                      {act.type === 'quiz' && `Completed quiz on `}
                      {act.type === 'create' && `Created deck: `}
                      <span className="text-indigo-600">{act.deckTitle}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      {act.score !== undefined && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 font-medium">Score: {act.score}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {stats.activities.length === 0 && (
                <p className="text-xs text-slate-400 italic">No study sessions logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Records Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCw className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Reset All Study Records?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This will clear all recorded study sessions, practice quiz scores, mastered card counters, and streaks, starting your tracking completely fresh from today with 0 records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onResetProgress) onResetProgress();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Yes, Reset Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
