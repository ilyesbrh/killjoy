import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import QuizRenderer from "./components/QuizRenderer";
import AdminPanel from "./AdminPanel";
import HomeworkBuilder from "./HomeworkBuilder";
import HomeworkView from "./HomeworkView";
import HomeworkHistory from "./HomeworkHistory";
import { lektionen, groupQuizzesByPage, decodeHomework, decodeHomeworkUrl } from "./data";
import type { HomeworkItem } from "./data";
import AppLogo from "./components/AppLogo";

// ─── Duolingo Tab Colors ─────────────────────────────────────────────

const tabColors: Record<
  string,
  { active: string; inactive: string; dot: string }
> = {
  kb: {
    active: "bg-duo-blue text-white border-b-4 border-duo-blue-dark",
    inactive: "bg-white text-duo-gray-dark border-2 border-gray-200 hover:border-duo-blue/40",
    dot: "bg-duo-blue",
  },
  training: {
    active: "bg-duo-purple text-white border-b-4 border-duo-purple-dark",
    inactive: "bg-white text-duo-gray-dark border-2 border-gray-200 hover:border-duo-purple/40",
    dot: "bg-duo-purple",
  },
  test: {
    active: "bg-duo-red text-white border-b-4 border-duo-red-dark",
    inactive: "bg-white text-duo-gray-dark border-2 border-gray-200 hover:border-duo-red/40",
    dot: "bg-duo-red",
  },
  other: {
    active: "bg-duo-gray-dark text-white border-b-4 border-gray-600",
    inactive: "bg-white text-duo-gray-dark border-2 border-gray-200 hover:border-gray-400",
    dot: "bg-duo-gray-dark",
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

// ─── Splash Screen ───────────────────────────────────────────────────

function SplashParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      bottom: `${5 + Math.random() * 20}%`,
      size: 4 + Math.random() * 6,
      delay: 0.5 + Math.random() * 2,
      duration: 2 + Math.random() * 1.5,
    })),
  []);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="splash-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showEnter, setShowEnter] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setShowEnter(true), 1500);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden ${fadeOut ? "splash-out" : ""}`}
      style={{ background: "linear-gradient(145deg, #4CAF00 0%, #58CC02 40%, #3D8B00 100%)" }}
    >
      {/* Floating particles */}
      <SplashParticles />

      {/* Glow ring behind logo */}
      <div className="relative flex items-center justify-center mb-6">
        <div
          className="splash-glow absolute w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
        />
        {/* Shield logo */}
        <div className="splash-shield relative">
          <AppLogo size={120} className="text-white drop-shadow-2xl" />
          {/* Bolt overlay for separate animation */}
          <svg
            viewBox="0 0 48 48"
            width={120}
            height={120}
            className="splash-bolt absolute inset-0"
            fill="none"
          >
            <path
              d="M27.5 11 L17 27 H23.5 L19.5 37 L33 23 H26.5 Z"
              fill="#FFC800"
              filter="drop-shadow(0 0 8px rgba(255, 200, 0, 0.6))"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 className="splash-title text-white font-black text-5xl tracking-tight text-center drop-shadow-lg">
        KillJoy
      </h1>

      {/* Tagline */}
      <p className="splash-subtitle text-white font-extrabold text-2xl mt-6 text-center">
        Bereit zum Lernen?
      </p>
      <p className="splash-subtitle text-white/50 font-bold text-sm mt-2 text-center tracking-wide"
        style={{ animationDelay: "1.3s" }}
      >
        {lektionen.length} Lektionen · {lektionen.reduce((s, l) => s + l.quizzes.length, 0)}+ Übungen
      </p>

      {/* Enter button */}
      <div className="mt-10 h-16">
        {showEnter && (
          <button
            onClick={handleEnter}
            className="splash-enter splash-enter-btn btn-3d px-12 py-4 rounded-2xl
              bg-white text-duo-green font-black text-lg uppercase tracking-widest
              border-b-4 border-gray-300
              cursor-pointer hover:bg-gray-50 transition-colors"
          >
            SPIELEN
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PWA Install Banner ─────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed or already installed as standalone
    if (localStorage.getItem("killjoy-pwa-dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem("killjoy-pwa-dismissed", "1");
  }, []);

  if (!visible) return null;

  return (
    <div className="pwa-banner bg-duo-blue text-white px-4 py-2.5 relative z-[60]">
      <div className="max-w-lg mx-auto flex items-center gap-3 w-full">
        <AppLogo size={32} className="text-white flex-shrink-0 drop-shadow" />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm leading-tight">KillJoy installieren</div>
          <div className="text-xs font-bold text-white/70 truncate">
            Zum Startbildschirm hinzufugen
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="btn-3d px-4 py-1.5 rounded-xl bg-white text-duo-blue font-extrabold text-xs
            uppercase tracking-wide border-b-[3px] border-gray-200 cursor-pointer
            hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          Installieren
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Tab Bar ──────────────────────────────────────────────────

function BottomTabBar({ active }: { active: "learn" | "homework" | "create" | "admin" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 safe-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        <TabLink href="#/" icon="learn" label="Lernen" isActive={active === "learn"} />
        <TabLink href="#/my-homework" icon="homework" label="Aufgaben" isActive={active === "homework"} />
        <TabLink href="#/homework" icon="create" label="Erstellen" isActive={active === "create"} />
        <TabLink href="#/admin" icon="admin" label="Mehr" isActive={active === "admin"} />
      </div>
    </nav>
  );
}

function TabLink({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: "learn" | "homework" | "create" | "admin";
  label: string;
  isActive: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center py-2 px-4 min-w-[64px] transition-colors ${
        isActive ? "text-duo-green" : "text-duo-gray hover:text-duo-gray-dark"
      }`}
    >
      <TabIcon icon={icon} isActive={isActive} />
      <span className={`text-xs mt-0.5 ${isActive ? "font-extrabold" : "font-bold"}`}>
        {label}
      </span>
    </a>
  );
}

function TabIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const cls = `w-6 h-6 ${isActive ? "text-duo-green" : ""}`;
  switch (icon) {
    case "learn":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "homework":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "create":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      );
    case "admin":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── App ─────────────────────────────────────────────────────────────

function App() {
  const route = useRoute();
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <SplashScreen onComplete={hideSplash} />;
  }

  const banner = <PwaInstallBanner />;

  switch (route.page) {
    case "admin":
      return (
        <div className="min-h-screen bg-duo-surface pb-20">
          {banner}
          <AdminPanel />
          <BottomTabBar active="admin" />
        </div>
      );
    case "homework-builder":
      return (
        <>
          {banner}
          <HomeworkBuilder />
          <BottomTabBar active="create" />
        </>
      );
    case "homework":
      return (
        <>
          {banner}
          <HomeworkView items={route.items} label={route.label} />
        </>
      );
    case "my-homework":
      return (
        <>
          {banner}
          <HomeworkHistory />
          <BottomTabBar active="homework" />
        </>
      );
    default:
      return (
        <StudentApp
          initialLektion={route.lektion}
          initialPageKey={route.pageKey}
        />
      );
  }
}

// ─── Student App ─────────────────────────────────────────────────────

function StudentApp({
  initialLektion,
  initialPageKey,
}: {
  initialLektion?: number;
  initialPageKey?: string;
}) {
  const initLIdx = initialLektion
    ? Math.max(0, Math.min(initialLektion - 1, lektionen.length - 1))
    : 0;

  const [currentLektion, setCurrentLektion] = useState(initLIdx);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

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

  const resolvedInitialPage = useRef(false);
  useEffect(() => {
    if (resolvedInitialPage.current || !initialPageKey) return;
    resolvedInitialPage.current = true;
    const idx = pages.findIndex((p) => p.key === initialPageKey);
    if (idx >= 0) setCurrentPage(idx);
  }, [pages, initialPageKey]);

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

  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabsRef.current?.children[currentPage] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, currentLektion]);

  const goToLektion = (idx: number) => {
    setCurrentLektion(idx);
    setCurrentPage(0);
    setShowPicker(false);
  };

  const handleComplete = (originalIdx: number, _score: number, _total: number) => {
    setCompleted((prev) => new Set(prev).add(`${currentLektion}-${originalIdx}`));
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

  const progress = lessonProgress(currentLektion);

  return (
    <div className="min-h-screen bg-duo-surface pb-24">
      {/* ── PWA Banner ── */}
      <PwaInstallBanner />
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
        <div className="max-w-lg mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <a href="#/" className="flex items-center justify-center">
                <AppLogo size={36} className="text-duo-green drop-shadow-sm" />
              </a>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div>
                  <div className="font-extrabold text-duo-text text-sm leading-tight">
                    Lektion {lektion.lektion}
                  </div>
                  <div className="text-xs font-bold text-duo-gray truncate max-w-[160px]">
                    {lektion.title}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-duo-gray transition-transform ${showPicker ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <svg className="w-5 h-5 text-duo-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="font-extrabold text-sm text-duo-gold tabular-nums">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Page tabs */}
          <div className="pb-2 -mx-4 px-4">
            <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-0.5">
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
                      btn-3d flex-shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide
                      transition-all cursor-pointer flex items-center gap-1.5
                      ${isActive ? tc.active : tc.inactive}
                    `}
                  >
                    {allDone && (
                      <svg
                        className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-duo-green"}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {page.label}
                    <span className={isActive ? "text-white/50" : "text-duo-gray"}>
                      {page.quizzes.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full bg-duo-green rounded-r-full transition-all duration-500"
            style={{ width: `${pageProgress() * 100}%` }}
          />
        </div>
      </header>

      {/* ── Lesson Picker Overlay ── */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-50 px-4">
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden max-h-[75vh] overflow-y-auto">
                <div className="p-4 border-b-2 border-gray-100 bg-duo-surface">
                  <h3 className="text-sm font-extrabold text-duo-text uppercase tracking-wider">
                    Lektion wahlen
                  </h3>
                </div>
                <div className="p-2">
                  {lektionen.map((l, idx) => {
                    const prog = lessonProgress(idx);
                    const isCurrent = idx === currentLektion;
                    const isComplete = prog === 1;
                    return (
                      <button
                        key={l.lektion}
                        onClick={() => goToLektion(idx)}
                        className={`
                          w-full text-left px-3 py-3 flex items-center gap-3
                          rounded-xl transition-all cursor-pointer mb-1
                          ${isCurrent ? "bg-duo-green/10 border-2 border-duo-green/30" : "hover:bg-gray-50 border-2 border-transparent"}
                        `}
                      >
                        {/* Circular progress indicator */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E5E5" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15.5" fill="none"
                              stroke={isComplete ? "#58CC02" : isCurrent ? "#1CB0F6" : "#AFAFAF"}
                              strokeWidth="3"
                              strokeDasharray="97.4"
                              strokeDashoffset={97.4 * (1 - prog)}
                              strokeLinecap="round"
                              className="transition-all duration-500"
                            />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${
                            isComplete ? "text-duo-green" : isCurrent ? "text-duo-blue" : "text-duo-gray-dark"
                          }`}>
                            {isComplete ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : l.lektion}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-extrabold truncate ${
                            isCurrent ? "text-duo-text" : "text-duo-gray-dark"
                          }`}>
                            {l.title}
                          </div>
                          <div className="text-xs font-bold text-duo-gray mt-0.5">
                            {l.quizzes.length} Ubungen · {Math.round(prog * 100)}%
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="text-xs font-extrabold text-duo-green uppercase tracking-wider">
                            Aktiv
                          </span>
                        )}
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
      <main className="py-4">
        <div className="space-y-3">
          {activePage?.quizzes.map(({ quiz, originalIndex }, qIdx) => {
            const isDone = completed.has(`${currentLektion}-${originalIndex}`);
            return (
              <div
                key={`${currentLektion}-${originalIndex}`}
                className={`relative transition-opacity duration-300 ${isDone ? "opacity-60" : ""}`}
              >
                {isDone && (
                  <div className="absolute top-4 right-6 z-10 w-8 h-8 bg-duo-green rounded-full flex items-center justify-center shadow-md border-b-2 border-duo-green-dark">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                <QuizRenderer
                  quiz={quiz}
                  stateKey={`${currentLektion}-${originalIndex}`}
                  onComplete={(score, total) => handleComplete(originalIndex, score, total)}
                  onReset={() => {
                    setCompleted((prev) => {
                      const next = new Set(prev);
                      next.delete(`${currentLektion}-${originalIndex}`);
                      return next;
                    });
                  }}
                />
                {qIdx < activePage.quizzes.length - 1 && (
                  <div className="max-w-lg mx-auto px-6 pt-2">
                    <hr className="border-gray-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Page Navigation */}
        <div className="max-w-lg mx-auto px-4 mt-6">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn-3d flex items-center justify-center w-12 h-12 rounded-2xl
                bg-white text-duo-gray-dark border-2 border-gray-200 border-b-4 border-b-gray-300
                transition-all cursor-pointer flex-shrink-0
                enabled:hover:bg-gray-50
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <div className="flex items-center gap-1 flex-wrap justify-center min-w-0">
              {pages.map((page, idx) => {
                const tc = tabColors[page.type] ?? tabColors.other;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`rounded-full transition-all cursor-pointer ${
                      idx === currentPage
                        ? `w-6 h-2 ${tc.dot} rounded-full`
                        : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              disabled={currentPage === pages.length - 1}
              className="btn-3d flex items-center justify-center w-12 h-12 rounded-2xl
                bg-duo-green text-white border-2 border-duo-green border-b-4 border-b-duo-green-dark
                transition-all cursor-pointer flex-shrink-0
                enabled:hover:bg-duo-green/90
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* ── Bottom Tab Bar ── */}
      <BottomTabBar active="learn" />
    </div>
  );
}

export default App;
