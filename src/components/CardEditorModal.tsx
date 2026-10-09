import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Layers, BookOpen } from 'lucide-react';
import { Deck, Flashcard, DifficultyLevel } from '../types';

interface CardEditorModalProps {
  deck: Deck;
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (updatedDeck: Deck) => void;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  deck,
  isOpen,
  onClose,
  onSaveDeck,
}) => {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [subject, setSubject] = useState(deck.subject);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(deck.difficulty);
  const [cards, setCards] = useState<Flashcard[]>([...deck.cards]);

  if (!isOpen) return null;

  const handleCardChange = (index: number, field: 'question' | 'answer', value: string) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: `card-${Date.now()}-${prev.length}`,
        question: '',
        answer: '',
        subject,
        difficulty,
      },
    ]);
  };

  const handleDeleteCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      alert('A deck must have at least one card with both a question and answer.');
      return;
    }

    const updated: Deck = {
      ...deck,
      title: title.trim() || 'Untitled Deck',
      description: description.trim(),
      subject: subject.trim() || 'General',
      difficulty,
      cards: validCards,
      updatedAt: new Date().toISOString(),
    };

    onSaveDeck(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Edit Deck & Cards
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Deck Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deck Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Cards List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">Flashcards</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-mono">{cards.length} cards</span>
              </div>
              <button
                type="button"
                onClick={handleAddCard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="space-y-4">
              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono font-semibold text-slate-700">
                      Card #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Question / Front
                      </label>
                      <textarea
                        value={card.question}
                        onChange={(e) => handleCardChange(idx, 'question', e.target.value)}
                        rows={2}
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Answer / Back
                      </label>
                      <textarea
                        value={card.answer}
                        onChange={(e) => handleCardChange(idx, 'answer', e.target.value)}
                        rows={2}
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {cards.length} cards in this deck
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
