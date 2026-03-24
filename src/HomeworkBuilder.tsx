import { useState, useMemo } from "react";
import {
  lektionen,
  groupQuizzesByPage,
  encodeHomework,
  encodeHomeworkUrl,
  saveHomeworkToHistory,
} from "./data";
import type { HomeworkItem } from "./data";
import AppLogo from "./components/AppLogo";

export default function HomeworkBuilder() {
  const [selected, setSelected] = useState<Map<number, Set<number>>>(new Map());
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedLektionen, setExpandedLektionen] = useState<Set<number>>(new Set());
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
      // Fallback
    }
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
              Hausaufgaben erstellen
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

      {/* Lektion Accordions */}
      <main className="max-w-lg mx-auto px-4 py-4">
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
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                {/* Lektion header */}
                <button
                  onClick={() => toggleExpanded(lNum)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-duo-surface transition-colors cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-xl bg-duo-blue/10 text-duo-blue flex items-center justify-center text-sm font-black flex-shrink-0">
                    {lNum}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-duo-text truncate">
                      {lektion.title}
                    </div>
                    <div className="text-xs font-bold text-duo-gray mt-0.5">
                      {lektion.quizzes.length} Ubungen
                      {selectedCount > 0 && (
                        <span className="text-duo-green font-extrabold ml-1">
                          · {selectedCount} ausgewahlt
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-duo-gray transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Exercises */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-100">
                    {/* Select all */}
                    <button
                      onClick={() => toggleAll(lNum, lektion.quizzes.length)}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 bg-duo-surface hover:bg-gray-200 transition-colors cursor-pointer border-b-2 border-gray-100"
                    >
                      <span
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          allSelected
                            ? "bg-duo-green border-duo-green-dark"
                            : selectedCount > 0
                              ? "bg-duo-green/30 border-duo-green"
                              : "border-gray-300 bg-white"
                        }`}
                      >
                        {(allSelected || selectedCount > 0) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            {allSelected ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            )}
                          </svg>
                        )}
                      </span>
                      <span className="text-xs font-extrabold text-duo-gray-dark uppercase tracking-wider">
                        {allSelected ? "Alle abwahlen" : "Alle auswahlen"}
                      </span>
                    </button>

                    {/* Grouped by page */}
                    {pages.map((page) => (
                      <div key={page.key}>
                        <div className="px-4 py-1.5 bg-duo-surface/50">
                          <span className="text-xs font-extrabold text-duo-gray uppercase tracking-wider">
                            {page.label}
                          </span>
                        </div>
                        {page.quizzes.map(({ quiz, originalIndex }) => {
                          const isChecked = lSelected?.has(originalIndex) ?? false;
                          return (
                            <button
                              key={originalIndex}
                              onClick={() => toggleQuiz(lNum, originalIndex)}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-duo-blue/5 transition-colors cursor-pointer"
                            >
                              <span
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isChecked
                                    ? "bg-duo-green border-duo-green-dark"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isChecked && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-duo-text">
                                  Ub. {quiz.exerciseNumber}
                                </span>
                                <span className="text-xs font-bold text-duo-gray ml-2">
                                  {quiz.type}
                                </span>
                              </div>
                              {quiz.instruction && (
                                <span className="text-xs font-bold text-duo-gray truncate max-w-[160px] hidden sm:inline">
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
        <div className="mt-4 bg-white rounded-2xl border-2 border-gray-200 p-4">
          <div className="mb-3">
            <input
              type="text"
              value={hwLabel}
              onChange={(e) => setHwLabel(e.target.value)}
              placeholder="Name der Hausaufgabe (optional)"
              className="w-full px-4 py-3 rounded-2xl bg-duo-surface border-2 border-gray-200 text-sm font-bold text-duo-text placeholder:text-duo-gray focus:outline-none focus:ring-2 focus:ring-duo-blue focus:border-duo-blue"
            />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-duo-gray-dark">
              <span className="font-black text-duo-green tabular-nums">
                {totalSelected}
              </span>{" "}
              Ubungen ausgewahlt
            </span>
            <button
              onClick={generateLink}
              disabled={totalSelected === 0}
              className="btn-3d px-5 py-2.5 rounded-2xl text-sm font-extrabold uppercase tracking-wide bg-duo-green text-white
                border-b-4 border-duo-green-dark
                transition-colors cursor-pointer
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
                className="flex-1 px-4 py-2.5 rounded-2xl bg-duo-surface border-2 border-gray-200 text-sm font-bold text-duo-gray-dark font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyLink}
                className="btn-3d px-5 py-2.5 rounded-2xl text-sm font-extrabold bg-white border-2 border-gray-200 border-b-4 border-b-gray-300 text-duo-text transition-colors cursor-pointer flex-shrink-0"
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
