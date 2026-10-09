import React from 'react';
import { Sparkles, Layers, BookOpen, Brain, Plus } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'create' | 'decks' | 'study' | 'quiz';
  onSelectTab: (tab: 'dashboard' | 'create' | 'decks' | 'study' | 'quiz') => void;
  hasGeminiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, hasGeminiKey }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-left text-slate-900 font-display font-bold text-xl tracking-tight whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <span>FlashMind AI</span>
          </button>

          {/* Zone 2: Single-line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('create')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'create' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Generate Cards
            </button>
            <button
              onClick={() => onSelectTab('decks')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'decks' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              My Decks
            </button>
            <button
              onClick={() => onSelectTab('quiz')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'quiz' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Quiz Mode
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Status indicator note */}
            <span
              className="hidden lg:inline-flex items-center text-xs text-slate-500 font-normal"
              title={
                hasGeminiKey
                  ? 'Gemini 3.8 Flash API Active'
                  : 'Demo / Local Extractive Engine Active'
              }
            >
              <span className={`w-2 h-2 rounded-full mr-1.5 ${hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {hasGeminiKey ? 'Gemini 3.8 Flash' : 'Local Engine'}
            </span>

            <button
              onClick={() => onSelectTab('create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Flashcards</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
