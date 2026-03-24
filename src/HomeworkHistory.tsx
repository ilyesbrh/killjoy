import { useState } from "react";
import {
  getHomeworkHistory,
  deleteHomeworkEntry,
  encodeHomeworkUrl,
  decodeHomework,
} from "./data";
import type { HomeworkHistoryEntry } from "./data";
import AppLogo from "./components/AppLogo";

const PROGRESS_KEY = "killjoy-progress";

function loadProgress(): Set<string> {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function countExercises(encoded: string): number {
  return encoded.split(",").reduce((sum, g) => {
    const parts = g.split(":");
    return sum + (parts[1]?.split(".").length ?? 0);
  }, 0);
}

function completionForEntry(
  entry: HomeworkHistoryEntry,
  progress: Set<string>
): { done: number; total: number } {
  const items = decodeHomework(entry.encoded);
  let done = 0;
  let total = 0;
  for (const item of items) {
    for (const idx of item.indices) {
      total++;
      if (progress.has(`${item.lektion - 1}-${idx}`)) done++;
    }
  }
  return { done, total };
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `Vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Gestern";
  if (days < 30) return `Vor ${days} Tagen`;
  return new Date(ts).toLocaleDateString("de-DE");
}

export default function HomeworkHistory() {
  const [history, setHistory] = useState<HomeworkHistoryEntry[]>(getHomeworkHistory);
  const progress = loadProgress();

  const handleDelete = (id: string) => {
    deleteHomeworkEntry(id);
    setHistory(getHomeworkHistory());
  };

  return (
    <div className="min-h-screen bg-duo-surface pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#/" className="flex items-center justify-center">
              <AppLogo size={36} className="text-duo-green drop-shadow-sm" />
            </a>
            <span className="font-extrabold text-duo-text text-sm">
              Meine Hausaufgaben
            </span>
          </div>
          <a
            href="#/"
            className="text-sm font-extrabold text-duo-blue hover:text-duo-blue-dark transition-colors"
          >
            Zuruck
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-[1.5rem] bg-white border-2 border-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-duo-gray" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-sm font-bold text-duo-gray mb-4">
              Noch keine Hausaufgaben vorhanden.
            </p>
            <a
              href="#/homework"
              className="inline-block btn-3d px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-duo-green text-white border-b-4 border-duo-green-dark"
            >
              Neue erstellen
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const totalExercises = countExercises(entry.encoded);
              const { done, total } = completionForEntry(entry, progress);
              const pct = total > 0 ? done / total : 0;
              const urlFragment = encodeHomeworkUrl(entry.encoded, entry.label);

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden group"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Circular progress */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E5E5" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.5" fill="none"
                          stroke={pct === 1 ? "#58CC02" : pct > 0 ? "#1CB0F6" : "#AFAFAF"}
                          strokeWidth="3"
                          strokeDasharray="97.4"
                          strokeDashoffset={97.4 * (1 - pct)}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
                        pct === 1 ? "text-duo-green" : pct > 0 ? "text-duo-blue" : "text-duo-gray"
                      }`}>
                        {pct === 1 ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : `${Math.round(pct * 100)}%`}
                      </span>
                    </div>

                    <a href={`#/hw/${urlFragment}`} className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-duo-text truncate">
                        {entry.label}
                      </div>
                      <div className="text-xs font-bold text-duo-gray mt-0.5">
                        {totalExercises} Ubungen · {done}/{total} erledigt · {formatRelativeDate(entry.lastOpenedAt)}
                      </div>
                      {/* Mini progress bar */}
                      {total > 0 && (
                        <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct === 1 ? "bg-duo-green" : "bg-duo-blue"
                            }`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      )}
                    </a>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-xl text-duo-gray hover:text-duo-red hover:bg-duo-red/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Loschen"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 text-center">
              <a
                href="#/homework"
                className="inline-block btn-3d px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-duo-green text-white border-b-4 border-duo-green-dark"
              >
                + Neue erstellen
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
