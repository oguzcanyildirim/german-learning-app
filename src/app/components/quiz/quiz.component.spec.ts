import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { QuizComponent } from './quiz.component';
import { QuizQuestion } from '../../models/quiz.model';

describe('QuizComponent', () => {
  let component: QuizComponent;
  let fixture: ComponentFixture<QuizComponent>;

  const sampleQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'Was bedeutet "Hund"?',
      options: ['Kedi', 'Kopek', 'Kus', 'Balik'],
      correctAnswer: 'Kopek',
      explanation: 'Hund = Kopek',
    },
    {
      id: 'q2',
      type: 'true-false',
      question: '"Der" maskulen artikel midir?',
      options: ['Dogru', 'Yanlis'],
      correctAnswer: 'Dogru',
      explanation: '"Der" maskulen (erkek) artikeldir.',
    },
    {
      id: 'q3',
      type: 'fill-blank',
      question: '"Ev" Almanca\'da nasil yazilir?',
      correctAnswer: 'Haus',
      explanation: 'Haus = Ev',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuizComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizComponent);
    component = fixture.componentInstance;
    component.questions = sampleQuestions;
    component.lessonId = 'a1-01';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start at question index 0', () => {
    expect(component.currentIndex).toBe(0);
  });

  it('should calculate progress percentage', () => {
    expect(component.progress).toBeCloseTo(33.33, 0);
  });

  it('should not allow checking without selecting an answer', () => {
    expect(component.canCheck()).toBeFalse();
  });

  it('should allow checking after selecting an option', () => {
    component.selectOption('Kopek');
    expect(component.canCheck()).toBeTrue();
  });

  it('should mark correct answer as correct', () => {
    component.selectOption('Kopek');
    component.checkAnswer();
    expect(component.isCorrect).toBeTrue();
    expect(component.isAnswered).toBeTrue();
  });

  it('should mark wrong answer as incorrect', () => {
    component.selectOption('Kedi');
    component.checkAnswer();
    expect(component.isCorrect).toBeFalse();
  });

  it('should advance to next question', () => {
    component.selectOption('Kopek');
    component.checkAnswer();
    component.nextQuestion();
    expect(component.currentIndex).toBe(1);
  });

  it('should finish quiz after last question', () => {
    // Answer all questions
    component.selectOption('Kopek');
    component.checkAnswer();
    component.nextQuestion();

    component.selectOption('Dogru');
    component.checkAnswer();
    component.nextQuestion();

    component.fillBlankAnswer = 'Haus';
    component.checkAnswer();
    component.nextQuestion();

    expect(component.quizFinished).toBeTrue();
    expect(component.result).toBeTruthy();
    expect(component.result!.percentage).toBe(100);
  });

  it('should provide appropriate score message', () => {
    component.selectOption('Kopek');
    component.checkAnswer();
    component.nextQuestion();

    component.selectOption('Yanlis');
    component.checkAnswer();
    component.nextQuestion();

    component.fillBlankAnswer = 'Katze';
    component.checkAnswer();
    component.nextQuestion();

    expect(component.result!.percentage).toBeCloseTo(33, 0);
    expect(component.getScoreMessage()).toContain('tekrar');
  });

  it('should reset state on restart', () => {
    component.selectOption('Kopek');
    component.checkAnswer();
    component.nextQuestion();
    component.restartQuiz();

    expect(component.currentIndex).toBe(0);
    expect(component.quizFinished).toBeFalse();
    expect(component.answers.length).toBe(0);
  });
});
