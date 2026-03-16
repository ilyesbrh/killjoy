import { useState, useMemo, useEffect, useRef } from "react";
import QuizRenderer from "./components/QuizRenderer";
import AdminPanel from "./AdminPanel";
import HomeworkBuilder from "./HomeworkBuilder";
import HomeworkView from "./HomeworkView";
import HomeworkHistory from "./HomeworkHistory";
import { lektionen, groupQuizzesByPage, decodeHomework, decodeHomeworkUrl } from "./data";
import type { HomeworkItem } from "./data";

// ─── Tab Styling ──────────────────────────────────────────────────────

const tabColors: Record<
  string,
  { active: string; inactive: string; dot: string }
> = {
  kb: {
    active: "bg-indigo-600 text-white shadow-sm",
    inactive:
      "bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200",
    dot: "bg-indigo-500",
  },
  training: {
    active: "bg-sky-600 text-white shadow-sm",
    inactive: "bg-white text-slate-600 hover:bg-sky-50 border border-slate-200",
    dot: "bg-sky-500",
  },
  test: {
    active: "bg-rose-600 text-white shadow-sm",
    inactive:
      "bg-white text-slate-600 hover:bg-rose-50 border border-slate-200",
    dot: "bg-rose-500",
  },
  other: {
    active: "bg-slate-700 text-white shadow-sm",
    inactive:
      "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200",
    dot: "bg-slate-500",
  },
};

// ─── Router ───────────────────────────────────────────────────────────

type Route =
  | { page: "student"; lektion?: number; pageKey?: string }
  | { page: "admin" }
  | { page: "homework-builder" }
  | { page: "homework"; items: HomeworkItem[]; label?: string }
  | { page: "my-homework" };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");

  if (h === "admin") return { page: "admin" };
  if (h === "homework") return { page: "homework-builder" };
  if (h === "my-homework") return { page: "my-homework" };
  if (h.startsWith("hw/")) {
    const { encoded, label } = decodeHomeworkUrl(h.slice(3));
    return { page: "homework", items: decodeHomework(encoded), label };
  }
  if (h.startsWith("lektion/")) {
    const parts = h.slice("lektion/".length).split("/");
    const lektion = parseInt(parts[0]) || 1;
    const pageKey = parts[1] ? decodeURIComponent(parts[1]) : undefined;
    return { page: "student", lektion, pageKey };
  }
  return { page: "student" };
}

function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return useMemo(() => parseHash(hash), [hash]);
}

function App() {
  const route = useRoute();
  switch (route.page) {
    case "admin":
      return <AdminPanel />;
    case "homework-builder":
      return <HomeworkBuilder />;
    case "homework":
      return <HomeworkView items={route.items} label={route.label} />;
    case "my-homework":
      return <HomeworkHistory />;
    default:
      return (
        <StudentApp
          initialLektion={route.lektion}
          initialPageKey={route.pageKey}
        />
      );
  }
}

// ─── Student App ──────────────────────────────────────────────────────

function StudentApp({
  initialLektion,
  initialPageKey,
}: {
  initialLektion?: number;
  initialPageKey?: string;
}) {
  // Resolve initial lektion index (1-based → 0-based)
  const initLIdx = initialLektion
    ? Math.max(0, Math.min(initialLektion - 1, lektionen.length - 1))
    : 0;

  const [currentLektion, setCurrentLektion] = useState(initLIdx);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  // Progress: persisted in localStorage
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("killjoy-progress");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem("killjoy-progress", JSON.stringify([...completed]));
  }, [completed]);

  const lektion = lektionen[currentLektion];
  const pages = useMemo(
    () => groupQuizzesByPage(lektion.quizzes),
    [currentLektion] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const activePage = pages[currentPage] ?? pages[0];

  // Resolve initial page key on first render
  const resolvedInitialPage = useRef(false);
  useEffect(() => {
    if (resolvedInitialPage.current || !initialPageKey) return;
    resolvedInitialPage.current = true;
    const idx = pages.findIndex((p) => p.key === initialPageKey);
    if (idx >= 0) setCurrentPage(idx);
  }, [pages, initialPageKey]);

  // Sync URL when navigating
  useEffect(() => {
    const lNum = lektion.lektion;
    const pageKey = pages[currentPage]?.key;
    const newHash = pageKey
      ? `#/lektion/${lNum}/${encodeURIComponent(pageKey)}`
      : `#/lektion/${lNum}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [currentLektion, currentPage, lektion.lektion, pages]);

  // Scroll active tab into view
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabsRef.current?.children[currentPage] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentPage]);

  // Scroll to top on page/lesson change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, currentLektion]);

  const goToLektion = (idx: number) => {
    setCurrentLektion(idx);
    setCurrentPage(0);
    setShowPicker(false);
  };

  const handleComplete = (
    originalIdx: number,
    _score: number,
    _total: number
  ) => {
    setCompleted((prev) =>
      new Set(prev).add(`${currentLektion}-${originalIdx}`)
    );
  };

  const lessonProgress = (lIdx: number) => {
    const total = lektionen[lIdx].quizzes.length;
    if (!total) return 0;
    let done = 0;
    for (let i = 0; i < total; i++) {
      if (completed.has(`${lIdx}-${i}`)) done++;
    }
    return done / total;
  };

  const pageProgress = () => {
    if (!activePage) return 0;
    const total = activePage.quizzes.length;
    if (!total) return 0;
    let done = 0;
    for (const { originalIndex } of activePage.quizzes) {
      if (completed.has(`${currentLektion}-${originalIndex}`)) done++;
    }
    return done / total;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
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
                  KillJoy
                </span>
                <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">
                  Menschen A1.1
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="#/my-homework"
                title="Meine Hausaufgaben"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
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
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.314a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5"
                  />
                </svg>
              </a>
              <a
                href="#/admin"
                title="Quiz Generator"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </a>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-1.5 py-0.5 rounded">
                  {lektion.lektion}
                </span>
                <span className="max-w-[140px] sm:max-w-[220px] truncate">
                  {lektion.title}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${showPicker ? "rotate-180" : ""}`}
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
            </div>
          </div>

          {/* Page tabs */}
          <div className="pb-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div
              ref={tabsRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5"
            >
              {pages.map((page, idx) => {
                const isActive = idx === currentPage;
                const tc = tabColors[page.type] ?? tabColors.other;
                const allDone = page.quizzes.every(({ originalIndex }) =>
                  completed.has(`${currentLektion}-${originalIndex}`)
                );
                return (
                  <button
                    key={page.key}
                    onClick={() => setCurrentPage(idx)}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
                      transition-all cursor-pointer flex items-center gap-1.5
                      ${isActive ? tc.active : tc.inactive}
                    `}
                  >
                    {allDone && (
                      <svg
                        className={`w-3 h-3 ${isActive ? "text-white/80" : "text-green-500"}`}
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
                    {page.label}
                    <span
                      className={`${isActive ? "text-white/60" : "text-slate-400"}`}
                    >
                      {page.quizzes.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Page progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${pageProgress() * 100}%` }}
          />
        </div>
      </header>

      {/* ── Lesson Picker Overlay ── */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-50 px-4 sm:px-0">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Lektion wählen
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {lektionen.map((l, idx) => {
                    const progress = lessonProgress(idx);
                    const isCurrent = idx === currentLektion;
                    return (
                      <button
                        key={l.lektion}
                        onClick={() => goToLektion(idx)}
                        className={`
                          w-full text-left px-4 py-3 flex items-center gap-3
                          transition-colors cursor-pointer
                          ${isCurrent ? "bg-indigo-50" : "hover:bg-slate-50"}
                        `}
                      >
                        <span
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            text-sm font-bold flex-shrink-0
                            ${isCurrent ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}
                          `}
                        >
                          {l.lektion}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm truncate ${isCurrent ? "font-semibold text-indigo-900" : "text-slate-700"}`}
                          >
                            {l.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progress === 1 ? "bg-green-500" : "bg-indigo-400"}`}
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                              {Math.round(progress * 100)}%
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {l.quizzes.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Page Exercises ── */}
      <main className="py-6">
        <div className="space-y-2">
          {activePage?.quizzes.map(({ quiz, originalIndex }, qIdx) => {
            const isDone = completed.has(
              `${currentLektion}-${originalIndex}`
            );
            return (
              <div
                key={`${currentLektion}-${originalIndex}`}
                className={`relative transition-opacity duration-300 ${isDone ? "opacity-60" : ""}`}
              >
                {isDone && (
                  <div className="absolute top-4 right-4 sm:right-[calc(50%-theme(maxWidth.2xl)/2+1rem)] z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg
                      className="w-3.5 h-3.5 text-white"
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
                  </div>
                )}
                <QuizRenderer
                  quiz={quiz}
                  stateKey={`${currentLektion}-${originalIndex}`}
                  onComplete={(score, total) =>
                    handleComplete(originalIndex, score, total)
                  }
                  onReset={() => {
                    setCompleted((prev) => {
                      const next = new Set(prev);
                      next.delete(`${currentLektion}-${originalIndex}`);
                      return next;
                    });
                  }}
                />
                {qIdx < activePage.quizzes.length - 1 && (
                  <div className="max-w-2xl mx-auto px-6 pt-2">
                    <hr className="border-slate-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
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

          <div className="flex items-center gap-1.5">
            {pages.map((page, idx) => {
              const tc = tabColors[page.type] ?? tabColors.other;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`
                    rounded-full transition-all cursor-pointer
                    ${
                      idx === currentPage
                        ? `w-6 h-2 ${tc.dot}`
                        : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                    }
                  `}
                />
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(pages.length - 1, p + 1))
            }
            disabled={currentPage === pages.length - 1}
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

export default App;
