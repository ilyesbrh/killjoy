# KillJoy — Menschen A1.1 Interactive Workbook

Interactive web app for practicing exercises from the **Menschen A1.1** German language textbook (Arbeitsbuch). Built with React, TypeScript, and Tailwind CSS.

**Live demo:** [ilyesbrh.github.io/killjoy](https://ilyesbrh.github.io/killjoy/)

## Features

- **12 Lektionen** with 8–22 exercises each, covering the full Menschen A1.1 Arbeitsbuch
- **9 quiz types:** word-bank fill, reorder, matching, fill-in-blank, image word bank, categorize, inline choice, write sentences, table fill
- **Page-grouped navigation** — exercises grouped by workbook page (KB references, Basistraining, Training, Test)
- **Progress tracking** — completion status saved per exercise in localStorage
- **Quiz state persistence** — answers survive page reloads and navigation
- **Homework system** — teachers can generate shareable homework links with custom labels; students see assigned exercises and track completion
- **SoundCloud audio support** — embedded player for listening exercises
- **Mobile-friendly** responsive design

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Vite 8
- Deployed via GitHub Actions to GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/killjoy/](http://localhost:5173/killjoy/)

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx              # Main app, routing, student view
├── data.ts              # Lektionen data, page grouping, homework encoding
├── useQuizState.ts      # localStorage-backed state hook for quiz persistence
├── types/quiz.ts        # TypeScript types for all 9 quiz types
├── components/          # Quiz type components (WordBankFill, Matching, etc.)
├── data/                # Exercise JSON files (lektion1–12.json)
├── HomeworkBuilder.tsx   # Teacher homework link generator
├── HomeworkView.tsx      # Student homework view
├── HomeworkHistory.tsx   # Homework history page
└── AdminPanel.tsx        # Quiz generator admin panel
```

## Homework Links

Teachers can create homework assignments at `#/homework`. Generated links encode specific exercises:

```
#/hw/1:0.3.5,2:1                    — auto-generated label
#/hw/1:0.3.5,2:1/Woche 3 Aufgabe    — custom label
```

Students open the link to see only the assigned exercises, with progress saved locally.

## License

MIT
