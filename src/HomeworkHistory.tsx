import { useState } from "react";
import {
  getHomeworkHistory,
  deleteHomeworkEntry,
  encodeHomeworkUrl,
  decodeHomework,
} from "./data";
import type { HomeworkHistoryEntry } from "./data";

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
  const [history, setHistory] = useState<HomeworkHistoryEntry[]>(
    getHomeworkHistory
  );
  const progress = loadProgress();

  const handleDelete = (id: string) => {
    deleteHomeworkEntry(id);
    setHistory(getHomeworkHistory());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
            <span className="font-bold text-slate-900 text-sm">
              Meine Hausaufgaben
            </span>
          </div>
          <a
            href="#/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Zurück
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Noch keine Hausaufgaben vorhanden.
            </p>
            <a
              href="#/homework"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Neue Hausaufgaben erstellen
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
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden group"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Completion indicator */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        pct === 1
                          ? "bg-green-100 text-green-700"
                          : pct > 0
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {pct === 1 ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        `${Math.round(pct * 100)}%`
                      )}
                    </div>

                    <a
                      href={`#/hw/${urlFragment}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {entry.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {totalExercises} Übungen · {done}/{total} erledigt ·{" "}
                        {formatRelativeDate(entry.lastOpenedAt)}
                      </div>
                      {/* Mini progress bar */}
                      {total > 0 && (
                        <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct === 1 ? "bg-green-500" : "bg-emerald-400"
                            }`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      )}
                    </a>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Löschen"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Link to builder */}
            <div className="pt-4 text-center">
              <a
                href="#/homework"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Neue Hausaufgaben erstellen
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
