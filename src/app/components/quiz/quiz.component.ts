import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { QuizQuestion, QuizResult, QuizAnswer } from '../../models/quiz.model';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  standalone: false,
})
export class QuizComponent implements OnInit {
  @Input() questions: QuizQuestion[] = [];
  @Input() lessonId = '';
  @Output() quizCompleted = new EventEmitter<QuizResult>();

  currentIndex = 0;
  selectedAnswer = '';
  fillBlankAnswer = '';
  matchSelections: Record<string, string> = {};
  isAnswered = false;
  isCorrect = false;
  answers: QuizAnswer[] = [];
  quizFinished = false;
  result: QuizResult | null = null;

  // Shuffled options for matching questions
  shuffledRightOptions: string[] = [];
  activeMatchLeft: string | null = null;

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get progress(): number {
    return ((this.currentIndex + 1) / this.questions.length) * 100;
  }

  ngOnInit(): void {
    if (this.currentQuestion?.type === 'matching' && this.currentQuestion.matchPairs) {
      this.shuffleMatchOptions();
    }
  }

  selectOption(option: string): void {
    if (this.isAnswered) return;
    this.selectedAnswer = option;
  }

  selectMatchLeft(left: string): void {
    if (this.isAnswered) return;
    this.activeMatchLeft = left;
  }

  selectMatchRight(right: string): void {
    if (this.isAnswered || !this.activeMatchLeft) return;
    this.matchSelections[this.activeMatchLeft] = right;
    this.activeMatchLeft = null;
  }

  removeMatch(left: string): void {
    if (this.isAnswered) return;
    delete this.matchSelections[left];
  }

  checkAnswer(): void {
    if (this.isAnswered) return;

    const q = this.currentQuestion;
    let userAnswer = '';
    let correct = false;

    switch (q.type) {
      case 'multiple-choice':
      case 'true-false':
        userAnswer = this.selectedAnswer;
        correct = userAnswer === q.correctAnswer;
        break;

      case 'fill-blank':
        userAnswer = this.fillBlankAnswer.trim();
        correct = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
        break;

      case 'matching':
        if (q.matchPairs) {
          const allCorrect = q.matchPairs.every(
            pair => this.matchSelections[pair.left] === pair.right
          );
          correct = allCorrect;
          userAnswer = JSON.stringify(this.matchSelections);
        }
        break;
    }

    this.isCorrect = correct;
    this.isAnswered = true;
    this.answers.push({
      questionId: q.id,
      userAnswer,
      isCorrect: correct,
    });
  }

  canCheck(): boolean {
    const q = this.currentQuestion;
    switch (q.type) {
      case 'multiple-choice':
      case 'true-false':
        return this.selectedAnswer !== '';
      case 'fill-blank':
        return this.fillBlankAnswer.trim() !== '';
      case 'matching':
        return q.matchPairs ? Object.keys(this.matchSelections).length === q.matchPairs.length : false;
      default:
        return false;
    }
  }

  nextQuestion(): void {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.resetQuestionState();

      if (this.currentQuestion?.type === 'matching' && this.currentQuestion.matchPairs) {
        this.shuffleMatchOptions();
      }
    } else {
      this.finishQuiz();
    }
  }

  private resetQuestionState(): void {
    this.selectedAnswer = '';
    this.fillBlankAnswer = '';
    this.matchSelections = {};
    this.isAnswered = false;
    this.isCorrect = false;
    this.activeMatchLeft = null;
  }

  private finishQuiz(): void {
    const correctCount = this.answers.filter(a => a.isCorrect).length;
    this.result = {
      lessonId: this.lessonId,
      totalQuestions: this.questions.length,
      correctAnswers: correctCount,
      percentage: Math.round((correctCount / this.questions.length) * 100),
      completedAt: new Date().toISOString(),
      answers: this.answers,
    };
    this.quizFinished = true;
    this.quizCompleted.emit(this.result);
  }

  restartQuiz(): void {
    this.currentIndex = 0;
    this.answers = [];
    this.quizFinished = false;
    this.result = null;
    this.resetQuestionState();

    if (this.currentQuestion?.type === 'matching' && this.currentQuestion.matchPairs) {
      this.shuffleMatchOptions();
    }
  }

  private shuffleMatchOptions(): void {
    if (!this.currentQuestion?.matchPairs) return;
    this.shuffledRightOptions = this.currentQuestion.matchPairs
      .map(p => p.right)
      .sort(() => Math.random() - 0.5);
  }

  // Used to check individual match correctness for visual feedback
  isMatchCorrect(left: string): boolean {
    if (!this.currentQuestion?.matchPairs) return false;
    const pair = this.currentQuestion.matchPairs.find(p => p.left === left);
    return pair ? this.matchSelections[left] === pair.right : false;
  }

  getScoreMessage(): string {
    if (!this.result) return '';
    const pct = this.result.percentage;
    if (pct === 100) return 'Mukemmel! Hepsini dogru bildiniz!';
    if (pct >= 80) return 'Harika! Cok iyi bir performans!';
    if (pct >= 60) return 'Iyi! Biraz daha pratik faydali olacaktir.';
    if (pct >= 40) return 'Idare eder. Konuyu tekrar gozden gecirmenizi oneririz.';
    return 'Bu konuyu tekrar calismaniz gerekiyor. Dersi tekrar okuyun.';
  }

  isRightUsed(right: string): boolean {
    return Object.values(this.matchSelections).includes(right);
  }

  getScoreColor(): string {
    if (!this.result) return '#6b7280';
    const pct = this.result.percentage;
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }
}
