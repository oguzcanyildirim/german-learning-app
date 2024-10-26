// Data models for the lesson/content system.
// Phases represent CEFR levels (A1-C2), each containing multiple lessons.

export interface Phase {
  id: string;
  title: string;        // e.g. "A1 - Anfänger"
  subtitle: string;     // e.g. "Beginner / Başlangıç"
  level: CefrLevel;
  color: string;        // hex color for the level badge
  icon: string;         // Ionic icon name
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  phaseId: string;
  title: string;        // e.g. "Artikel (der, die, das)"
  subtitle: string;     // brief description
  content: string;      // markdown content with grammar, examples, tables
  keyTerms: KeyTerm[];
  quiz: QuizQuestion[];
  llmPrompts: LlmPrompt[];
  estimatedMinutes: number;
  order: number;
  isTelcPrep?: boolean; // marks telc exam preparation lessons
}

export interface KeyTerm {
  german: string;
  turkish: string;
  example?: string;     // example sentence
}

export interface LlmPrompt {
  title: string;        // short description of what this prompt does
  prompt: string;       // the actual prompt text to copy-paste
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Maps each level to its theme color for consistent UI
export const LEVEL_COLORS: Record<CefrLevel, string> = {
  'A1': '#10b981',
  'A2': '#14b8a6',
  'B1': '#3b82f6',
  'B2': '#6366f1',
  'C1': '#8b5cf6',
  'C2': '#d97706',
};
