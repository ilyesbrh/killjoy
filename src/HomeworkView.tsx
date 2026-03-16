import { useState, useMemo, useEffect, useCallback } from "react";
import QuizRenderer from "./components/QuizRenderer";
import { lektionen, encodeHomework, saveHomeworkToHistory } from "./data";
import type { HomeworkItem } from "./data";
import type { Quiz } from "./types/quiz";

const STORAGE_KEY = "killjoy-progress";

function loadProgress(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveProgress(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/** Progress key matching StudentApp format: "lektionIdx-quizIdx" (0-based lektion) */
function progressKey(lektionNum: number, quizIndex: number): string {
  return `${lektionNum - 1}-${quizIndex}`;
}

interface Props {
  items: HomeworkItem[];
  label?: string;
}

interface HWQuiz {
  lektionNum: number;
  lektionTitle: string;
  quizIndex: number;
  quiz: Quiz;
  /** Pre-computed progress key for localStorage */
  pKey: string;
}

export default function HomeworkView({ items, label }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(loadProgress);

  // Persist to localStorage whenever completed changes
  useEffect(() => {
    saveProgress(completed);
  }, [completed]);

  // Save this homework to history on mount
  useEffect(() => {
    if (items.length > 0) {
      saveHomeworkToHistory(encodeHomework(items), items, label);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve homework items to actual quizzes
  const hwQuizzes: HWQuiz[] = useMemo(() => {
    const result: HWQuiz[] = [];
    for (const item of items) {
      const lektion = lektionen.find((l) => l.lektion === item.lektion);
      if (!lektion) continue;
      for (const idx of item.indices) {
        if (idx >= 0 && idx < lektion.quizzes.length) {
          result.push({
            lektionNum: lektion.lektion,
            lektionTitle: lektion.title,
            quizIndex: idx,
            quiz: lektion.quizzes[idx],
            pKey: progressKey(lektion.lektion, idx),
          });
        }
      }
    }
    return result;
  }, [items]);

  const total = hwQuizzes.length;
  const current = hwQuizzes[currentIdx];
  const completedCount = useMemo(
    () => hwQuizzes.filter((q) => completed.has(q.pKey)).length,
    [hwQuizzes, completed]
  );
  const isDone = completedCount === total && total > 0;

  const isQuizCompleted = useCallback(
    (idx: number) => completed.has(hwQuizzes[idx].pKey),
    [completed, hwQuizzes]
  );

  // Start on the first incomplete exercise
  useEffect(() => {
    const firstIncomplete = hwQuizzes.findIndex((q) => !completed.has(q.pKey));
    if (firstIncomplete >= 0 && firstIncomplete !== currentIdx) {
      setCurrentIdx(firstIncomplete);
    }
    // Only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = (_score: number, _totalScore: number) => {
    const key = current.pKey;
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  if (total === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Keine Übungen gefunden
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Der Link enthält keine gültigen Übungen.
          </p>
          <a
            href="#/"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Fertig!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Du hast alle {total} Übungen abgeschlossen.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setCompleted((prev) => {
                  const next = new Set(prev);
                  for (const q of hwQuizzes) next.delete(q.pKey);
                  return next;
                });
                setCurrentIdx(0);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Nochmal
            </button>
            <a
              href="#/"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Zur Startseite
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <a
                href="#/"
                className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </a>
              <div className="leading-tight">
                <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                  {label || "Hausaufgaben"}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  {currentIdx + 1} / {total}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              L{current.lektionNum} · Üb. {current.quiz.exerciseNumber}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${(completedCount / total) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Quiz */}
      <main className="py-6">
        <QuizRenderer
          key={`${current.lektionNum}-${current.quizIndex}`}
          quiz={current.quiz}
          stateKey={current.pKey}
          onComplete={handleComplete}
          onReset={() => {
            const key = current.pKey;
            setCompleted((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }}
        />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              transition-all cursor-pointer text-slate-700
              enabled:hover:bg-slate-100
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Zurück
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1">
            {hwQuizzes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`rounded-full transition-all cursor-pointer ${
                  idx === currentIdx
                    ? "w-6 h-2 bg-emerald-500"
                    : isQuizCompleted(idx)
                      ? "w-2 h-2 bg-green-400"
                      : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            disabled={currentIdx === total - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              transition-all cursor-pointer text-slate-700
              enabled:hover:bg-slate-100
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Weiter
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
