import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Brain,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Award,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Deck, QuizQuestion } from '../types';
import { AiService } from '../services/ai';

interface QuizModeProps {
  deck: Deck;
  onBack: () => void;
  onQuizCompleted: (scorePercentage: number, totalQuestions: number) => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ deck, onBack, onQuizCompleted }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Initialize or generate quiz questions
  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const generated = await AiService.generateQuiz(deck.cards, deck.subject);
        if (isMounted) {
          setQuestions(generated);
          setCurrentIndex(0);
          setSelectedAnswers({});
          setIsFinished(false);
        }
      } catch (err) {
        console.error('Quiz question load error:', err);
        // Fallback local distractor generator
        if (isMounted) {
          const local = AiService.generateLocalQuiz(deck.cards);
          setQuestions(local);
        }
      } finally {
        if (isMounted) setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [deck]);

  const currentQ = questions[currentIndex];
  const userChoice = selectedAnswers[currentIndex];
  const isAnswered = userChoice !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return; // Disallow changing answer once revealed

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate final score
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswerIndex) {
          correctCount += 1;
        }
      });
      const scorePercentage = Math.round((correctCount / questions.length) * 100);
      setIsFinished(true);

      if (scorePercentage >= 70) {
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }

      onQuizCompleted(scorePercentage, questions.length);
    }
  };

  const handleRetry = () => {
    // Reshuffle questions
    const reshuffled = AiService.generateLocalQuiz(deck.cards);
    setQuestions(reshuffled);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  if (isLoadingQuestions) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <Brain className="w-10 h-10 text-indigo-600 mx-auto mb-3 animate-bounce" />
        <h3 className="text-base font-semibold text-slate-900">Preparing Practice Quiz</h3>
        <p className="text-xs text-slate-500 mt-1">
          Generating multiple-choice questions and plausible distractors for "{deck.title}"...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Not enough cards for a quiz</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          A quiz requires at least 2 cards to formulate multiple choice alternatives.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Deck
        </button>
      </div>
    );
  }

  // Quiz Results Screen
  if (isFinished) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Quiz Completed!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assessment for {deck.title}
            </p>
          </div>

          <div className="max-w-xs mx-auto p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-4xl font-display font-bold text-slate-900 tabular-nums">
              {percentage}%
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-emerald-600 tabular-nums">{correctCount}</span> correct
              out of <span className="tabular-nums">{questions.length}</span> questions
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Back to Decks
            </button>
          </div>
        </div>

        {/* Detailed Review Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Question Review & Explanations
          </h3>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userPick = selectedAnswers[idx];
              const isCorrect = userPick === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl p-5 border shadow-xs space-y-3 ${
                    isCorrect ? 'border-emerald-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold font-mono text-slate-500">
                      Question #{idx + 1}
                    </span>
                    <span
                      className={`font-semibold inline-flex items-center gap-1 ${
                        isCorrect ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">{q.question}</p>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100 flex items-start gap-2">
                      <span className="font-semibold shrink-0">Correct Answer:</span>
                      <span>{q.options[q.correctAnswerIndex]}</span>
                    </div>

                    {!isCorrect && userPick !== undefined && (
                      <div className="p-2.5 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-start gap-2">
                        <span className="font-semibold shrink-0">Your Answer:</span>
                        <span>{q.options[userPick]}</span>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
                      <span className="font-semibold text-slate-700 mr-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </button>

        <div className="text-center">
          <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
            Quiz Mode
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 tabular-nums">
          {Math.round(((currentIndex + 1) / questions.length) * 100)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Prompt
          </span>
          <h2 className="text-lg md:text-xl font-display font-semibold text-slate-900 mt-1 leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userChoice === optIdx;
            const isCorrect = optIdx === currentQ.correctAnswerIndex;

            let buttonStyle = 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                buttonStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400';
              } else if (isSelected && !isCorrect) {
                buttonStyle = 'bg-red-50 border-red-300 text-red-950 ring-1 ring-red-300';
              } else {
                buttonStyle = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-xl border text-left text-xs md:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${buttonStyle}`}
              >
                <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-mono shrink-0 text-slate-700">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Box */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              {userChoice === currentQ.correctAnswerIndex ? (
                <span className="text-emerald-700">✓ Spot on! Correct answer.</span>
              ) : (
                <span className="text-red-700">✕ Incorrect answer selected.</span>
              )}
            </div>
            {currentQ.explanation && (
              <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
            )}
          </div>
        )}

        {/* Next Question Control */}
        {isAnswered && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? 'See Quiz Results' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
