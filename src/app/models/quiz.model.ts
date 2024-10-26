// Quiz question types used at the end of each lesson module.
// Supports multiple choice, fill-in-the-blank, and matching exercises.

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false';
  question: string;
  options?: string[];           // for multiple-choice
  correctAnswer: string;        // the correct answer text
  explanation: string;          // shown after answering (Turkish explanation)
  matchPairs?: MatchPair[];     // for matching type
}

export interface MatchPair {
  left: string;    // e.g. German word
  right: string;   // e.g. Turkish translation
}

export interface QuizResult {
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  completedAt: string;  // ISO date string
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}
