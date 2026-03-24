import { useState, useMemo, useEffect, useCallback } from "react";
import QuizRenderer from "./components/QuizRenderer";
import { lektionen, encodeHomework, saveHomeworkToHistory } from "./data";
import type { HomeworkItem } from "./data";
import type { Quiz } from "./types/quiz";
import AppLogo from "./components/AppLogo";

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
  pKey: string;
}

export default function HomeworkView({ items, label }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(loadProgress);

  useEffect(() => {
    saveProgress(completed);
  }, [completed]);

  useEffect(() => {
    if (items.length > 0) {
      saveHomeworkToHistory(encodeHomework(items), items, label);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    const firstIncomplete = hwQuizzes.findIndex((q) => !completed.has(q.pKey));
    if (firstIncomplete >= 0 && firstIncomplete !== currentIdx) {
      setCurrentIdx(firstIncomplete);
    }
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
      <div className="min-h-screen bg-duo-surface flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-[1.5rem] bg-white border-2 border-gray-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-duo-gray" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-duo-text mb-1">
            Keine Ubungen gefunden
          </h2>
          <p className="text-sm font-bold text-duo-gray mb-4">
            Der Link enthalt keine gultigen Ubungen.
          </p>
          <a
            href="#/"
            className="inline-block btn-3d px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-duo-green text-white border-b-4 border-duo-green-dark"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-duo-surface flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-24 h-24 rounded-[2rem] bg-duo-green-light border-2 border-duo-green flex items-center justify-center mx-auto mb-5">
            <svg className="w-12 h-12 text-duo-green" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-duo-text mb-2">
            Fertig!
          </h2>
          <p className="text-sm font-bold text-duo-gray mb-6">
            Du hast alle {total} Ubungen abgeschlossen.
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
              className="btn-3d px-5 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-white text-duo-gray-dark border-2 border-gray-200 border-b-4 border-b-gray-300 cursor-pointer"
            >
              Nochmal
            </button>
            <a
              href="#/"
              className="btn-3d px-5 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-duo-green text-white border-b-4 border-duo-green-dark"
            >
              Startseite
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-duo-surface pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <a href="#/" className="flex items-center justify-center">
                <AppLogo size={36} className="text-duo-green drop-shadow-sm" />
              </a>
              <div>
                <div className="font-extrabold text-duo-text text-sm truncate max-w-[180px]">
                  {label || "Hausaufgaben"}
                </div>
                <div className="text-xs font-bold text-duo-gray">
                  {currentIdx + 1} / {total}
                </div>
              </div>
            </div>

            <div className="text-xs font-extrabold text-duo-gray-dark">
              L{current.lektionNum} · Ub. {current.quiz.exerciseNumber}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-duo-green rounded-r-full transition-all duration-500"
            style={{ width: `${(completedCount / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Quiz */}
      <main className="py-4">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-extrabold uppercase
              bg-white text-duo-gray-dark border-2 border-gray-200 border-b-4 border-b-gray-300
              transition-all cursor-pointer
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Zuruck
          </button>

          <div className="flex items-center gap-1.5">
            {hwQuizzes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`rounded-full transition-all cursor-pointer ${
                  idx === currentIdx
                    ? "w-7 h-2.5 bg-duo-green"
                    : isQuizCompleted(idx)
                      ? "w-2.5 h-2.5 bg-duo-green/60"
                      : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
            disabled={currentIdx === total - 1}
            className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-extrabold uppercase
              bg-duo-green text-white border-2 border-duo-green border-b-4 border-b-duo-green-dark
              transition-all cursor-pointer
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Weiter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
