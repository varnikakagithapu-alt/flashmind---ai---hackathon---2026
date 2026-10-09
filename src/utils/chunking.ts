import { DocumentChunk, ChunkingOptions, ChunkingResult } from '../types';

export const DEFAULT_CHUNK_OPTIONS: Required<ChunkingOptions> = {
  maxChunkSize: 3500, // ~600-800 words per chunk
  minChunkSize: 500,  // Minimum chars before starting new chunk
  overlap: 250,       // Characters of context overlap between chunks
  preserveHeadings: true,
};

/**
 * Normalizes text lines and cleans redundant blank lines
 */
export function cleanDocumentText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts a concise, human-readable section title from a chunk of text
 */
export function extractChunkTitle(content: string, index: number, fallback = 'Section'): string {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return `${fallback} ${index + 1}`;

  // 1. Look for markdown headings (# Heading, ## Subheading)
  for (const line of lines.slice(0, 5)) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch && headingMatch[1].length < 80) {
      return headingMatch[1].replace(/[*_#]/g, '').trim();
    }
  }

  // 2. Look for chapter or numbered markers (Chapter 1, Module 2, Part A, 1. Introduction)
  const markerRegex = /^(?:chapter|part|section|module|unit|lecture|topic)\s+[0-9a-zivx]+(?::|\s*-|\s*—|\s+)?\s*(.*)$/i;
  for (const line of lines.slice(0, 5)) {
    const markerMatch = line.match(markerRegex);
    if (markerMatch) {
      const rest = markerMatch[1]?.trim();
      return rest ? `${line.slice(0, markerMatch[0].length - rest.length).trim()}: ${rest.slice(0, 50)}` : line.slice(0, 50);
    }
    const numHeadingMatch = line.match(/^\d+(?:\.\d+)*\s+([A-Z][a-zA-Z0-9\s-]{3,60})$/);
    if (numHeadingMatch) {
      return line.slice(0, 60);
    }
  }

  // 3. Look for short capitalized title-like first line
  const firstLine = lines[0];
  if (firstLine.length >= 4 && firstLine.length <= 60 && !firstLine.endsWith('.') && !firstLine.includes(',')) {
    return firstLine.replace(/[*_#]/g, '').trim();
  }

  // 4. Fallback: first significant topic words
  const words = firstLine.split(/\s+/).slice(0, 6).join(' ');
  if (words.length > 5) {
    return `${words}...`;
  }

  return `${fallback} ${index + 1}`;
}

/**
 * Intelligently chunks large documents using semantic boundaries
 * (headings, page markers, and paragraphs) with sliding window overlap.
 */
export function chunkDocument(text: string, options: ChunkingOptions = {}): ChunkingResult {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options };
  const cleaned = cleanDocumentText(text);

  if (!cleaned) {
    return {
      chunks: [],
      totalChunks: 0,
      totalWords: 0,
      totalChars: 0,
      isLargeDocument: false,
    };
  }

  const totalChars = cleaned.length;
  const totalWords = cleaned.split(/\s+/).filter(Boolean).length;
  const isLargeDocument = totalChars > opts.maxChunkSize || totalWords > 650;

  // If text is short enough, return as single chunk
  if (!isLargeDocument) {
    const singleChunk: DocumentChunk = {
      id: 'chunk-0',
      index: 0,
      title: extractChunkTitle(cleaned, 0, 'Main Topic'),
      content: cleaned,
      wordCount: totalWords,
      charCount: totalChars,
      estimatedReadingTimeMinutes: Math.max(1, Math.ceil(totalWords / 200)),
    };

    return {
      chunks: [singleChunk],
      totalChunks: 1,
      totalWords,
      totalChars,
      isLargeDocument: false,
    };
  }

  // Split text into semantic blocks (paragraphs and headings)
  const rawParagraphs = cleaned.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const blocks: string[] = [];

  for (const p of rawParagraphs) {
    // If a single paragraph is excessively large, split by sentences
    if (p.length > opts.maxChunkSize) {
      const sentences = p.split(/(?<=[.?!])\s+/).filter(Boolean);
      let tempSentenceBlock = '';
      for (const s of sentences) {
        if ((tempSentenceBlock + ' ' + s).length > opts.maxChunkSize && tempSentenceBlock.length > 0) {
          blocks.push(tempSentenceBlock.trim());
          tempSentenceBlock = s;
        } else {
          tempSentenceBlock = tempSentenceBlock ? `${tempSentenceBlock} ${s}` : s;
        }
      }
      if (tempSentenceBlock) {
        blocks.push(tempSentenceBlock.trim());
      }
    } else {
      blocks.push(p);
    }
  }

  const chunks: DocumentChunk[] = [];
  let currentChunkBlocks: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isHeading = opts.preserveHeadings && /^#{1,3}\s+|^(?:Chapter|Section|Module|Part)\s+\d+/i.test(block);

    // Should we finalize current chunk?
    const exceedsMaxSize = currentLength + block.length > opts.maxChunkSize && currentLength >= opts.minChunkSize;
    const isNaturalBreak = isHeading && currentLength >= opts.minChunkSize;

    if ((exceedsMaxSize || isNaturalBreak) && currentChunkBlocks.length > 0) {
      const chunkText = currentChunkBlocks.join('\n\n').trim();
      const wordCount = chunkText.split(/\s+/).filter(Boolean).length;

      chunks.push({
        id: `chunk-${chunkIndex}`,
        index: chunkIndex,
        title: extractChunkTitle(chunkText, chunkIndex),
        content: chunkText,
        wordCount,
        charCount: chunkText.length,
        estimatedReadingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
      });

      chunkIndex++;

      // Sliding window overlap: carry over trailing context from previous chunk
      if (opts.overlap > 0 && chunkText.length > opts.overlap) {
        const lastBlock = currentChunkBlocks[currentChunkBlocks.length - 1];
        const overlapSnippet = lastBlock.length <= opts.overlap
          ? lastBlock
          : lastBlock.slice(lastBlock.length - opts.overlap);

        currentChunkBlocks = [`[Context continuation: ...${overlapSnippet.trim()}]`, block];
        currentLength = overlapSnippet.length + block.length;
      } else {
        currentChunkBlocks = [block];
        currentLength = block.length;
      }
    } else {
      currentChunkBlocks.push(block);
      currentLength += block.length + 2; // +2 for newline
    }
  }

  // Push final remaining block
  if (currentChunkBlocks.length > 0) {
    const finalChunkText = currentChunkBlocks.join('\n\n').trim();
    const wordCount = finalChunkText.split(/\s+/).filter(Boolean).length;

    // If final chunk is too tiny and previous chunk exists, append to previous chunk if within budget
    if (finalChunkText.length < opts.minChunkSize && chunks.length > 0) {
      const prev = chunks[chunks.length - 1];
      if (prev.charCount + finalChunkText.length <= opts.maxChunkSize * 1.3) {
        prev.content += '\n\n' + finalChunkText;
        prev.charCount = prev.content.length;
        prev.wordCount = prev.content.split(/\s+/).filter(Boolean).length;
        prev.estimatedReadingTimeMinutes = Math.max(1, Math.ceil(prev.wordCount / 200));
      } else {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          index: chunkIndex,
          title: extractChunkTitle(finalChunkText, chunkIndex, 'Conclusion / Section'),
          content: finalChunkText,
          wordCount,
          charCount: finalChunkText.length,
          estimatedReadingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
        });
      }
    } else {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        index: chunkIndex,
        title: extractChunkTitle(finalChunkText, chunkIndex),
        content: finalChunkText,
        wordCount,
        charCount: finalChunkText.length,
        estimatedReadingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
      });
    }
  }

  return {
    chunks,
    totalChunks: chunks.length,
    totalWords,
    totalChars,
    isLargeDocument: chunks.length > 1,
  };
}

/**
 * Distributes flashcard quotas proportionally across chunks based on content density
 */
export function distributeCardCounts(chunks: DocumentChunk[], totalCards: number): DocumentChunk[] {
  if (chunks.length === 0 || totalCards <= 0) return chunks;

  const totalWords = chunks.reduce((sum, c) => sum + Math.max(c.wordCount, 1), 0);
  let remainingCards = totalCards;

  // Step 1: Assign at least 1 card per chunk if possible, then distribute proportionally
  const allocated = chunks.map((chunk) => {
    const proportion = Math.max(chunk.wordCount, 1) / totalWords;
    const cards = Math.max(1, Math.round(totalCards * proportion));
    return { ...chunk, allocatedCardCount: cards };
  });

  // Adjust to strictly match totalCards
  let currentSum = allocated.reduce((sum, c) => sum + (c.allocatedCardCount || 1), 0);

  while (currentSum !== totalCards) {
    if (currentSum > totalCards) {
      // Find chunk with largest allocation > 1 to decrement
      const candidate = allocated
        .filter((c) => (c.allocatedCardCount || 1) > 1)
        .sort((a, b) => (b.allocatedCardCount || 0) - (a.allocatedCardCount || 0))[0];
      if (candidate) {
        candidate.allocatedCardCount = (candidate.allocatedCardCount || 1) - 1;
        currentSum--;
      } else {
        break;
      }
    } else {
      // Add to chunk with highest word count
      const candidate = [...allocated].sort((a, b) => b.wordCount - a.wordCount)[0];
      if (candidate) {
        candidate.allocatedCardCount = (candidate.allocatedCardCount || 1) + 1;
        currentSum++;
      } else {
        break;
      }
    }
  }

  return allocated;
}

/**
 * Computes token overlap similarity between two question strings
 */
function questionSimilarity(q1: string, q2: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokens1 = new Set(normalize(q1));
  const tokens2 = new Set(normalize(q2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }

  const union = tokens1.size + tokens2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Deduplicates and ranks flashcards generated across multiple chunks
 */
export function deduplicateAndRankCards<T extends { question: string; answer: string; section?: string }>(
  cards: T[],
  similarityThreshold = 0.72
): T[] {
  const result: T[] = [];

  for (const card of cards) {
    const q = card.question.trim();
    const a = card.answer.trim();
    if (!q || !a) continue;

    // Check against existing accepted cards
    const isDuplicate = result.some((existing) => {
      // Exact match
      if (existing.question.toLowerCase().trim() === q.toLowerCase()) return true;
      // Similarity match
      return questionSimilarity(existing.question, q) > similarityThreshold;
    });

    if (!isDuplicate) {
      result.push(card);
    }
  }

  return result;
}
