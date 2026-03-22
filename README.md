# Deutsch Lernen

A German learning app I built for myself and friends who are learning German as Turkish speakers. Covers A1 through C2 with grammar lessons, flashcards, quizzes, and a bunch of LLM prompts you can copy-paste into ChatGPT/Claude for practice.

## Why I built this

I wanted something that combined structured grammar lessons with spaced repetition flashcards in one place, specifically for Turkish speakers. Most apps out there are either English-based or don't go beyond A2. This one covers all CEFR levels up to C2, including some Telc/Goethe exam prep material.

## Tech stack and why

**Ionic + Angular** — I picked Ionic because I needed something that works on both web and Android without maintaining two codebases. Angular was the natural choice since I already use it at work, so I didn't want to learn a new framework on top of everything else.

**Capacitor** — Gives me access to native features (haptics, status bar, local storage) without writing actual native code. The app is offline-first, all content lives in bundled JSON files and progress is stored locally via Capacitor Preferences.

**No backend** — Deliberately kept this simple. There's no user accounts, no cloud sync, no API. Everything runs on-device. Less infrastructure to worry about, and it works without internet.

**Markdown for lessons** — Lesson content is written in markdown and rendered with `marked`. This made it easy to write and format grammar explanations with tables, code-like examples, and highlighted terms without building a custom rich text system.

## How it's structured

Four tabs:

- **Dersler** (Lessons) — Roadmap view with A1–C2 phases as expandable accordions. Each lesson has markdown content, key terms, a quiz, and LLM prompts. Progress is tracked per lesson.
- **Kartlar** (Flashcards) — Spaced repetition review using the SM-2 algorithm. Cards are grouped by lesson/phase, and the scheduling (interval, ease factor, next review date) is persisted locally.
- **İstatistik** (Stats) — Streak tracking, study time, phase completion percentages, and a 7-day activity chart.
- **Hakkında** (About) — App info, CEFR level descriptions, and a filterable LLM prompt library.

### Content

67 lessons across 6 CEFR levels. Content is stored as per-level JSON files (`a1.json` through `c2.json`) under `src/assets/content/`. Topics range from basic alphabet and pronunciation at A1 to Partizipialkonstruktionen and Modalpartikeln at C1/C2.

All UI text and explanations are in Turkish since the target audience is Turkish speakers learning German.

### Data persistence

Two keys in Capacitor Preferences:
- `german_learning_progress` — lesson completion, quiz scores, streaks, daily stats
- `german_flashcard_state` — SM-2 state per card (repetitions, ease factor, interval, next review)

No data leaves the device.

## Setup

```bash
npm install
ng serve          # runs on localhost:4200
```

For Android:

```bash
npx cap sync
npx cap open android
```

Requires Node 18+ and Angular CLI.

## Some decisions worth mentioning

- **SM-2 ease floor at 1.3** — The original SM-2 uses 1.3 as the minimum ease factor. I kept it but I'm not 100% sure it's the best choice for language learning where you might legitimately struggle with the same card many times. Might bump it to 1.5 later.
- **No unit tests for page components** — Service tests are solid (content, flashcard, progress all have proper specs), but the page component tests are just the default `should create`. Didn't feel like the pages had enough standalone logic to justify complex tests — most logic lives in the services.
- **Large content commits** — The lesson JSON files are big and were added in a couple of large commits. Didn't make sense to split them into 20 tiny commits since the content was written in batches.
