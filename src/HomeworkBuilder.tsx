import { useState, useMemo } from "react";
import {
  lektionen,
  groupQuizzesByPage,
  encodeHomework,
  encodeHomeworkUrl,
  saveHomeworkToHistory,
} from "./data";
import type { HomeworkItem } from "./data";

export default function HomeworkBuilder() {
  // Track selected quiz indices per lektion (1-based lektion number → Set of quiz indices)
  const [selected, setSelected] = useState<Map<number, Set<number>>>(
    new Map()
  );
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedLektionen, setExpandedLektionen] = useState<Set<number>>(
    new Set()
  );
  const [hwLabel, setHwLabel] = useState("");

  const totalSelected = useMemo(() => {
    let n = 0;
    for (const s of selected.values()) n += s.size;
    return n;
  }, [selected]);

  const toggleExpanded = (lNum: number) => {
    setExpandedLektionen((prev) => {
      const next = new Set(prev);
      if (next.has(lNum)) next.delete(lNum);
      else next.add(lNum);
      return next;
    });
  };

  const toggleQuiz = (lNum: number, idx: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(lNum) || []);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      if (set.size === 0) next.delete(lNum);
      else next.set(lNum, set);
      return next;
    });
  };

  const toggleAll = (lNum: number, quizCount: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const existing = next.get(lNum);
      if (existing && existing.size === quizCount) {
        next.delete(lNum);
      } else {
        const set = new Set<number>();
        for (let i = 0; i < quizCount; i++) set.add(i);
        next.set(lNum, set);
      }
      return next;
    });
  };

  const generateLink = () => {
    const items: HomeworkItem[] = [];
    for (const [lNum, indices] of selected.entries()) {
      if (indices.size > 0) {
        items.push({
          lektion: lNum,
          indices: [...indices].sort((a, b) => a - b),
        });
      }
    }
    items.sort((a, b) => a.lektion - b.lektion);
    const encoded = encodeHomework(items);
    const trimmedLabel = hwLabel.trim() || undefined;
    const urlFragment = encodeHomeworkUrl(encoded, trimmedLabel);
    const url = `${window.location.origin}${window.location.pathname}#/hw/${urlFragment}`;
    setGeneratedLink(url);
    setCopied(false);
    saveHomeworkToHistory(encoded, items, trimmedLabel);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a
              href="#/"
              className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm"
            >
              <span className="text-white font-extrabold text-sm tracking-tight">
                K
              </span>
            </a>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 text-sm">
                Hausaufgaben erstellen
              </span>
            </div>
          </div>
          <a
            href="#/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Zurück
          </a>
        </div>
      </header>

      {/* Lektion Accordions */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-2">
          {lektionen.map((lektion) => {
            const lNum = lektion.lektion;
            const isExpanded = expandedLektionen.has(lNum);
            const lSelected = selected.get(lNum);
            const selectedCount = lSelected?.size ?? 0;
            const allSelected = selectedCount === lektion.quizzes.length;
            const pages = groupQuizzesByPage(lektion.quizzes);

            return (
              <div
                key={lNum}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Lektion header */}
                <button
                  onClick={() => toggleExpanded(lNum)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {lNum}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {lektion.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {lektion.quizzes.length} Übungen
                      {selectedCount > 0 && (
                        <span className="text-indigo-600 font-medium ml-1">
                          · {selectedCount} ausgewählt
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Exercises */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Select all */}
                    <button
                      onClick={() => toggleAll(lNum, lektion.quizzes.length)}
                      className="w-full text-left px-4 py-2 flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          allSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : selectedCount > 0
                              ? "bg-indigo-100 border-indigo-400"
                              : "border-slate-300"
                        }`}
                      >
                        {(allSelected || selectedCount > 0) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                          >
                            {allSelected ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14"
                              />
                            )}
                          </svg>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {allSelected ? "Alle abwählen" : "Alle auswählen"}
                      </span>
                    </button>

                    {/* Grouped by page */}
                    {pages.map((page) => (
                      <div key={page.key}>
                        <div className="px-4 py-1.5 bg-slate-50/50">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {page.label}
                          </span>
                        </div>
                        {page.quizzes.map(({ quiz, originalIndex }) => {
                          const isChecked = lSelected?.has(originalIndex) ?? false;
                          return (
                            <button
                              key={originalIndex}
                              onClick={() => toggleQuiz(lNum, originalIndex)}
                              className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                            >
                              <span
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isChecked
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {isChecked && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={3}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4.5 12.75l6 6 9-13.5"
                                    />
                                  </svg>
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-slate-700">
                                  Üb. {quiz.exerciseNumber}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">
                                  {quiz.type}
                                </span>
                              </div>
                              {quiz.instruction && (
                                <span className="text-xs text-slate-400 truncate max-w-[180px] hidden sm:inline">
                                  {quiz.instruction}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <div className="mb-3">
            <input
              type="text"
              value={hwLabel}
              onChange={(e) => setHwLabel(e.target.value)}
              placeholder="Name der Hausaufgabe (optional)"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600">
              <span className="font-bold text-indigo-600 tabular-nums">
                {totalSelected}
              </span>{" "}
              Übungen ausgewählt
            </span>
            <button
              onClick={generateLink}
              disabled={totalSelected === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white
                hover:bg-indigo-700 transition-colors cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Link erstellen
            </button>
          </div>

          {generatedLink && (
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex-shrink-0"
              >
                {copied ? "Kopiert!" : "Kopieren"}
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
