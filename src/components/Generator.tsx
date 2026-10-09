import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  RefreshCw,
  Sliders,
  FileCheck,
  FileCode,
  X,
  Layers,
  Eye,
  EyeOff,
  BookOpen,
  Filter,
} from 'lucide-react';
import { AiService, GenerationResult } from '../services/ai';
import { Deck, DifficultyLevel, CardTypeOption, Flashcard, ChunkingResult, DocumentChunk } from '../types';

interface GeneratorProps {
  onDeckCreated: (deck: Deck) => void;
  hasGeminiKey: boolean;
}

export const Generator: React.FC<GeneratorProps> = ({ onDeckCreated, hasGeminiKey }) => {
  // Input tabs
  const [activeTab, setActiveTab] = useState<'paste' | 'pdf' | 'txt'>('paste');

  // Input states
  const [documentName, setDocumentName] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [fileExtractionMeta, setFileExtractionMeta] = useState<{
    pageCount?: number;
    wordCount?: number;
    filename?: string;
  } | null>(null);

  // Document chunking states
  const [chunkingResult, setChunkingResult] = useState<ChunkingResult | null>(null);
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
  const [isChunkingActive, setIsChunkingActive] = useState<boolean>(true);
  const [previewChunkId, setPreviewChunkId] = useState<string | null>(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  // Generation options
  const [topic, setTopic] = useState<string>('');
  const [cardCount, setCardCount] = useState<number>(8);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [cardType, setCardType] = useState<CardTypeOption>('Mixed');
  const [language, setLanguage] = useState<string>('English');

  // Generation processing states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated review cards
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);
  const [draftCards, setDraftCards] = useState<Flashcard[]>([]);
  const [deckDescription, setDeckDescription] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically analyze document for semantic chunks
  useEffect(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setChunkingResult(null);
      setSelectedChunkIds(new Set());
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await AiService.chunkDocument(trimmed);
        setChunkingResult(result);
        if (result.isLargeDocument) {
          // By default, select all sections
          setSelectedChunkIds(new Set(result.chunks.map((c) => c.id)));
        } else {
          setSelectedChunkIds(new Set());
        }
      } catch (err) {
        console.warn('Document chunking analysis error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputText]);

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    setErrorMessage(null);
    setIsExtractingFile(true);
    setUploadedFile(file);
    setDocumentName(file.name.replace(/\.[^/.]+$/, ''));

    try {
      const extracted = await AiService.extractPdf(file);
      setInputText(extracted.text);
      setFileExtractionMeta({
        pageCount: extracted.pageCount,
        wordCount: extracted.wordCount,
        filename: file.name,
      });
      if (!topic) {
        setTopic(extracted.title || file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract text from PDF document.');
      setUploadedFile(null);
      setFileExtractionMeta(null);
    } finally {
      setIsExtractingFile(false);
    }
  };

  // Handle TXT file upload
  const handleTxtUpload = async (file: File) => {
    setErrorMessage(null);
    setIsExtractingFile(true);
    setUploadedFile(file);
    setDocumentName(file.name.replace(/\.[^/.]+$/, ''));

    try {
      const extracted = await AiService.extractTxt(file);
      setInputText(extracted.text);
      setFileExtractionMeta({
        wordCount: extracted.wordCount,
        filename: file.name,
      });
      if (!topic) {
        setTopic(extracted.title || file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read TXT file.');
      setUploadedFile(null);
      setFileExtractionMeta(null);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isTxt = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');

      if (isPdf) {
        setActiveTab('pdf');
        handlePdfUpload(file);
      } else if (isTxt) {
        setActiveTab('txt');
        handleTxtUpload(file);
      } else {
        setErrorMessage('Unsupported file format. Please upload a PDF or TXT file.');
      }
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFileExtractionMeta(null);
    setInputText('');
    setDocumentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load a built-in valid sample PDF to verify parsing
  const handleLoadSamplePdf = () => {
    const samplePdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 420>>stream
BT
/F1 14 Tf
50 720 Td
(CELLULAR BIOLOGY & METABOLISM - LECTURE NOTES) Tj
0 -30 Td
/F1 11 Tf
(1. The Mitochondrion is often called the powerhouse of the cell.) Tj
0 -20 Td
(Its primary role is adenosine triphosphate ATP synthesis through oxidative phosphorylation.) Tj
0 -20 Td
(2. Cristae are folded inner membrane structures that maximize surface area for ATP synthase.) Tj
0 -20 Td
(3. The Krebs Cycle occurs inside the mitochondrial matrix producing NADH and FADH2.) Tj
0 -20 Td
(4. Glycolysis takes place in the cytoplasm and breaks down glucose into two pyruvate molecules.) Tj
0 -20 Td
(5. Photosynthesis in chloroplasts converts sunlight into chemical energy stored in glucose.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000302 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
775
%%EOF`;
    const blob = new Blob([samplePdfContent], { type: 'application/pdf' });
    const sampleFile = new File([blob], 'Cellular_Biology_Notes.pdf', { type: 'application/pdf' });
    handlePdfUpload(sampleFile);
  };

  // Trigger flashcard generation
  const handleGenerate = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMessage('Please provide study text or upload a document first.');
      return;
    }

    if (trimmed.length < 25) {
      setErrorMessage('Study notes are too short. Please provide at least a few sentences (25+ characters).');
      return;
    }

    const isChunkedMode = isChunkingActive && chunkingResult?.isLargeDocument && selectedChunkIds.size > 0;
    const activeChunks = isChunkedMode
      ? chunkingResult!.chunks.filter((c) => selectedChunkIds.has(c.id))
      : undefined;

    setErrorMessage(null);
    setIsGenerating(true);

    if (isChunkedMode && activeChunks && activeChunks.length > 1) {
      setGenerationStep(
        `Synthesizing balanced flashcards across ${activeChunks.length} sections...`
      );
    } else {
      setGenerationStep('Analyzing notes content and extracting terminology...');
    }

    try {
      setTimeout(() => {
        if (isChunkedMode && activeChunks && activeChunks.length > 1) {
          setGenerationStep('Balancing section quotas and deduplicating cards...');
        } else {
          setGenerationStep('Synthesizing high-yield questions and concise explanations...');
        }
      }, 1000);

      const result = await AiService.generateFlashcards({
        text: trimmed,
        topic: topic || documentName || 'Study Notes',
        count: cardCount,
        difficulty,
        cardType,
        language,
        chunks: activeChunks,
      });

      setGeneratedResult(result);
      // Map to editable draft cards
      const mapped = result.cards.map((c, i) => ({
        id: `draft-card-${Date.now()}-${i}`,
        question: c.question,
        answer: c.answer,
        subject: c.subject || topic || 'General',
        section: c.section,
        difficulty: c.difficulty || difficulty,
        explanation: c.explanation || '',
      }));
      setDraftCards(mapped);

      const sectionInfo = isChunkedMode && activeChunks
        ? ` covering ${activeChunks.length} sections (${difficulty.toLowerCase()})`
        : ` covering ${difficulty.toLowerCase()} level concepts`;

      setDeckDescription(
        `Generated from "${documentName || topic || 'Study Notes'}"${sectionInfo}.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Edit card question / answer
  const handleCardChange = (index: number, field: 'question' | 'answer', value: string) => {
    setDraftCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove card from draft
  const handleDeleteDraftCard = (index: number) => {
    setDraftCards((prev) => prev.filter((_, i) => i !== index));
  };

  // Add blank card to draft
  const handleAddManualCard = () => {
    setDraftCards((prev) => [
      ...prev,
      {
        id: `draft-card-${Date.now()}-${prev.length}`,
        question: '',
        answer: '',
        subject: topic || 'General',
        difficulty,
      },
    ]);
  };

  // Final Save to Decks
  const handleSaveDeck = () => {
    const validCards = draftCards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      setErrorMessage('Please ensure at least one flashcard has both a question and answer.');
      return;
    }

    const newDeck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'> = {
      title: topic || documentName || 'My Study Deck',
      description: deckDescription || `Synthesized from notes on ${topic || 'Revision'}.`,
      subject: topic || 'General',
      difficulty,
      cards: validCards,
      tags: [topic || 'Notes', difficulty, 'Exam Prep'].filter(Boolean),
      sourceDocumentName: documentName || (uploadedFile ? uploadedFile.name : undefined),
      isGeneratedByAI: generatedResult?.source === 'gemini',
    };

    onDeckCreated(newDeck as Deck);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Step Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
          Create Flashcards
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload PDF documents, paste notes, and generate interactive revision flashcards.
        </p>
      </div>

      {/* Generation Source Banner */}
      <div
        className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          hasGeminiKey
            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {hasGeminiKey ? (
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-semibold">
              {hasGeminiKey
                ? 'AI Engine Ready: Gemini 3.8 Flash'
                : 'Local Extractive Fallback Mode Active'}
            </span>
            <span className="text-slate-600 ml-1">
              {hasGeminiKey
                ? 'High-retention question synthesis powered by Google Gemini.'
                : 'Runs offline extractive algorithms from your raw notes. Real Gemini API will automatically engage once an API key is connected.'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Input Selector Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/60 p-2 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'pdf'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('txt')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'txt'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Upload TXT / Markdown</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Document metadata row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document / Deck Title
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => {
                  setDocumentName(e.target.value);
                  if (!topic) setTopic(e.target.value);
                }}
                placeholder="e.g. Bio 101: Cell Organelles & Respiration"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic or Focus Area
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Mitochondria, ATP Synthesis, DNA"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tab 1: Paste Notes */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Paste lecture notes, study guide, or summary below:</span>
                <span className="tabular-nums font-mono">{wordCount} words</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your study materials here... E.g., The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms..."
                rows={9}
                className="w-full p-4 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans leading-relaxed resize-y"
              />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputText(
                      `# Chapter 1: Foundations of Cellular Biology
Cells are the fundamental structural and functional units of all living organisms. Eukaryotic cells contain membrane-bound organelles including the nucleus, endoplasmic reticulum, and mitochondria. The cell membrane consists of a phospholipid bilayer with embedded transport proteins that regulate selective permeability.

# Chapter 2: Cellular Metabolism and ATP Synthesis
Cellular respiration is the catabolic pathway by which cells break down glucose to generate ATP. Glycolysis occurs in the cytoplasm yielding 2 pyruvate, 2 net ATP, and 2 NADH. The citric acid cycle (Krebs cycle) operates in the mitochondrial matrix, oxidizing acetyl-CoA and reducing NAD+ and FAD into electron carriers. Oxidative phosphorylation across the inner mitochondrial membrane drives ATP synthase.

# Chapter 3: Molecular Genetics and DNA Replication
Deoxyribonucleic acid (DNA) stores genetic information in a double helix of antiparallel strands connected by hydrogen bonds between complementary nitrogenous bases (adenine to thymine, guanine to cytosine). DNA replication is semiconservative: helicase unwinds the double helix, and DNA polymerase synthesizes leading and lagging strands using RNA primers.

# Chapter 4: Protein Synthesis: Transcription & Translation
The central dogma of molecular biology describes information transfer from DNA to RNA to protein. Transcription in the nucleus produces messenger RNA (mRNA) catalyzed by RNA polymerase. Translation occurs on ribosomes in the cytoplasm where transfer RNA (tRNA) anticodons read mRNA codons to assemble amino acid chains.

# Chapter 5: Photosynthesis and Energy Capture
Autotrophs convert radiant sunlight into chemical bonds via photosynthesis inside chloroplasts. Light-dependent reactions split water molecules, generating oxygen, ATP, and NADPH. The light-independent Calvin cycle uses the enzyme RuBisCO to fix carbon dioxide into sugars.`
                    );
                    setDocumentName('General Biology Comprehensive Syllabus (5 Chapters)');
                    setTopic('Comprehensive Cellular Biology');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  Insert large multi-chapter syllabus (5 sections)
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setInputText(
                      `Photosynthesis is the biological process by which autotrophs convert light energy into chemical energy stored in glucose.
It occurs primarily within chloroplasts containing the green pigment chlorophyll.
The process is divided into two stages:
1. Light-Dependent Reactions: Take place in thylakoid membranes where light energy excites electrons in Photosystem II and I, splitting water (photolysis) to release molecular oxygen and producing ATP and NADPH.
2. Calvin Cycle (Light-Independent Reactions): Occurs in the stroma where the enzyme RuBisCO fixes carbon dioxide (carbon fixation), using ATP and NADPH to synthesize glyceraldehyde-3-phosphate (G3P).
Cellular respiration is the reciprocal catabolic pathway where glucose is broken down in the presence of oxygen to generate adenosine triphosphate (ATP).`
                    );
                    setDocumentName('Plant Biology: Photosynthesis & Respiration');
                    setTopic('Photosynthesis');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Insert short notes
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: PDF Upload */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              {!uploadedFile ? (
                <>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePdfUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">
                    Click to select PDF or drag & drop here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload lecture slides, textbook excerpts, or assignments (up to 25MB)
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleLoadSamplePdf}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Try sample biology lecture PDF
                  </button>
                </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs uppercase">
                        PDF
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {uploadedFile.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          {fileExtractionMeta?.pageCount && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{fileExtractionMeta.pageCount} pages</span>
                            </>
                          )}
                          {fileExtractionMeta?.wordCount && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{fileExtractionMeta.wordCount} words extracted</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleClearFile}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Extracted Text Preview & Editor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">Extracted Text Preview (Editable)</span>
                      <span className="tabular-nums font-mono">{wordCount} words</span>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={7}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed resize-y"
                    />
                  </div>
                </div>
              )}

              {isExtractingFile && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting text from PDF document...</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: TXT Upload */}
          {activeTab === 'txt' && (
            <div className="space-y-4">
              {!uploadedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt,.md,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleTxtUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <FileCode className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">
                    Click to select TXT or Markdown file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Plain text notes, lecture summaries, or exported docs
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                        TXT
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {uploadedFile.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                          {fileExtractionMeta?.wordCount && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{fileExtractionMeta.wordCount} words</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleClearFile}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Extracted Text Preview */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">File Content Preview (Editable)</span>
                      <span className="tabular-nums font-mono">{wordCount} words</span>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={7}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Large Document Chunking Panel */}
          {chunkingResult && chunkingResult.isLargeDocument && (
            <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Large Document Chunking Active
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                        {chunkingResult.totalChunks} Semantic Chunks
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Segmented with sliding window context to prevent truncation and guarantee balanced coverage across all chapters.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChunkIds.size === chunkingResult.chunks.length) {
                        setSelectedChunkIds(new Set());
                      } else {
                        setSelectedChunkIds(new Set(chunkingResult.chunks.map((c) => c.id)));
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    {selectedChunkIds.size === chunkingResult.chunks.length ? 'Deselect All' : 'Select All Chunks'}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChunkingActive}
                      onChange={(e) => setIsChunkingActive(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>Multi-chunk mode</span>
                  </label>
                </div>
              </div>

              {isChunkingActive && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Select sections to include ({selectedChunkIds.size} of {chunkingResult.chunks.length} selected):
                    </span>
                    <span className="font-mono text-[11px]">
                      {chunkingResult.totalWords} words across {chunkingResult.chunks.length} sections
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {chunkingResult.chunks.map((chunk, idx) => {
                      const isSelected = selectedChunkIds.has(chunk.id);
                      const isPreview = previewChunkId === chunk.id;
                      const estimatedCards = Math.max(
                        1,
                        Math.round((chunk.wordCount / (chunkingResult.totalWords || 1)) * cardCount)
                      );

                      return (
                        <div
                          key={chunk.id}
                          className={`rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? 'bg-white border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  setSelectedChunkIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(chunk.id);
                                    else next.delete(chunk.id);
                                    return next;
                                  });
                                }}
                                className="mt-0.5 rounded accent-indigo-600 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {idx + 1}. {chunk.title}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span>{chunk.wordCount} words</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-indigo-600 font-medium">~{estimatedCards} cards</span>
                                  <span aria-hidden="true">·</span>
                                  <span>~{chunk.estimatedReadingTimeMinutes} min read</span>
                                </div>
                              </div>
                            </label>

                            <button
                              type="button"
                              onClick={() => setPreviewChunkId(isPreview ? null : chunk.id)}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors"
                              title={isPreview ? 'Hide chunk text' : 'Inspect chunk text'}
                            >
                              {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {isPreview && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
                              <pre className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded max-h-36 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                                {chunk.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuration Grid */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card Count: <span className="text-indigo-600 tabular-nums">{cardCount}</span>
              </label>
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={cardCount}
                onChange={(e) => setCardCount(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>4 cards</span>
                <span>12 cards</span>
                <span>20 cards</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Easy">Easy (Definitions & Terms)</option>
                <option value="Medium">Medium (Conceptual Understanding)</option>
                <option value="Hard">Hard (Deep Mechanisms & Nuance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card Type
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as CardTypeOption)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Mixed">Mixed (Q&A and Definitions)</option>
                <option value="Question and Answer">Question and Answer</option>
                <option value="Definition">Term and Definition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Mandarin">Mandarin (中文)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Cards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Flashcards</span>
                </>
              )}
            </button>
          </div>

          {/* Generation Progress Indicator */}
          {isGenerating && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{generationStep}</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-200/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
              </div>
              <p className="text-[11px] text-indigo-700">
                Grounding cards strictly in your source notes to avoid hallucination.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Cards Review & Edit Section */}
      {draftCards.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  Step 2: Review & Edit Before Saving
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{draftCards.length} Cards Generated</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    generatedResult?.source === 'gemini'
                      ? 'text-indigo-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {generatedResult?.source === 'gemini'
                    ? 'AI Synthesized (Gemini 3.8 Flash)'
                    : 'Local Extracted Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Refine questions, tweak wording, or add custom cards before adding to your library.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddManualCard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
              <button
                onClick={handleSaveDeck}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save to My Decks</span>
              </button>
            </div>
          </div>

          {/* Section Filter if cards have sections */}
          {(() => {
            const uniqueSections = Array.from(
              new Set(draftCards.map((c) => c.section).filter(Boolean) as string[])
            );
            if (uniqueSections.length <= 1) return null;

            return (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 mr-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Section Filter:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSectionFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedSectionFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All Sections ({draftCards.length})
                </button>
                {uniqueSections.map((sec) => {
                  const count = draftCards.filter((c) => c.section === sec).length;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSectionFilter(sec)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        selectedSectionFilter === sec
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sec} ({count})
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draftCards
              .map((card, originalIndex) => ({ card, originalIndex }))
              .filter(({ card }) => selectedSectionFilter === 'all' || card.section === selectedSectionFilter)
              .map(({ card, originalIndex }) => (
              <div
                key={card.id}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium font-mono text-slate-700 shrink-0">
                      Card #{originalIndex + 1}
                    </span>
                    {card.section && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 border border-indigo-200/70 text-indigo-700 truncate max-w-[200px]"
                        title={card.section}
                      >
                        {card.section}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-indigo-600 font-medium">{card.difficulty}</span>
                    <button
                      onClick={() => handleDeleteDraftCard(originalIndex)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Front (Question / Term)
                    </label>
                    <textarea
                      value={card.question}
                      onChange={(e) => handleCardChange(originalIndex, 'question', e.target.value)}
                      rows={2}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900 resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Back (Answer / Definition)
                    </label>
                    <textarea
                      value={card.answer}
                      onChange={(e) => handleCardChange(originalIndex, 'answer', e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 leading-relaxed resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 font-medium">
              Ready to study? Save all {draftCards.length} cards to your permanent library.
            </span>
            <button
              onClick={handleSaveDeck}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save & Launch Deck</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
