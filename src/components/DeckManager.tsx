import React, { useState, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  Play,
  Brain,
  Edit2,
  Trash2,
  Download,
  Upload,
  BookOpen,
  Layers,
  CheckCircle,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { Deck } from '../types';
import { StorageService } from '../services/storage';

interface DeckManagerProps {
  decks: Deck[];
  onStartStudy: (deck: Deck) => void;
  onStartQuiz: (deck: Deck) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onImportDeck: (importedDeck: Deck) => void;
  onCreateNew: () => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  onStartStudy,
  onStartQuiz,
  onEditDeck,
  onDeleteDeck,
  onImportDeck,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // Extract distinct subjects
  const subjects = Array.from(new Set(decks.map((d) => d.subject).filter(Boolean)));

  // Filtered decks
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'all' || deck.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleExportJson = (deck: Deck) => {
    StorageService.exportDeckAsJson(deck);
  };

  const handleExportAnki = (deck: Deck) => {
    StorageService.exportDeckAsAnki(deck);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const imported = StorageService.importDeckFromJson(text);
        onImportDeck(imported);
      } catch (err: any) {
        setImportError(err.message || 'Failed to import JSON flashcard deck.');
      }
    };
    reader.onerror = () => setImportError('Error reading uploaded file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
            My Study Decks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize, edit, review, and export your flashcard revision collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileImportInputRef}
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileImport}
          />
          <button
            onClick={() => fileImportInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deck</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {importError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks, subjects, tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
          >
            <option value="all">All Subjects ({decks.length})</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map((deck) => {
          const masteredCount = deck.cards.filter((c) => c.mastered).length;
          const percentage =
            deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;

          return (
            <div
              key={deck.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Unboxed Metadata row */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                  <span className="font-semibold text-indigo-700">{deck.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>{deck.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-mono">{deck.cards.length} cards</span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 leading-snug mb-2 line-clamp-1">
                  {deck.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {deck.description}
                </p>

                {/* Mastery progress */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Mastery Progress</span>
                    <span className="font-medium text-slate-700 tabular-nums">{percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {deck.sourceDocumentName && (
                  <div className="text-[11px] text-slate-400 truncate">
                    Source: {deck.sourceDocumentName}
                  </div>
                )}
              </div>

              {/* Bottom Card Action Bar */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartStudy(deck)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Study</span>
                  </button>
                  <button
                    onClick={() => onStartQuiz(deck)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Quiz</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditDeck(deck)}
                      className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <button
                      onClick={() => handleExportAnki(deck)}
                      title="Export Anki TSV"
                      className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                    >
                      Anki
                    </button>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <button
                      onClick={() => handleExportJson(deck)}
                      title="Export JSON backup"
                      className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                    >
                      JSON
                    </button>
                  </div>

                  <button
                    onClick={() => setDeckToDelete(deck)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDecks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No decks found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery
              ? 'Try modifying your search or filters.'
              : 'Create your first flashcard deck to begin studying.'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"
          >
            Create Flashcards
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deckToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Flashcard Deck?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{deckToDelete.title}"</span>? This will permanently remove its {deckToDelete.cards.length} cards.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeckToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteDeck(deckToDelete.id);
                  setDeckToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Delete Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
