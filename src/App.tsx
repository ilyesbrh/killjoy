import { useState } from "react";
import QuizRenderer from "./components/QuizRenderer";
import lektion1Data from "./data/lektion1.json";
import type { Lektion } from "./types/quiz";

const lektion1 = lektion1Data as unknown as Lektion;

function App() {
  const [currentQuiz, setCurrentQuiz] = useState(0);

  const quiz = lektion1.quizzes[currentQuiz];
  const totalQuizzes = lektion1.quizzes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            KillJoy{" "}
            <span className="text-sm font-normal text-gray-500">
              Menschen A1.1
            </span>
          </h1>
          <span className="text-sm text-gray-500">
            Lektion {lektion1.lektion}: {lektion1.title}
          </span>
        </div>
      </header>

      {/* Quiz area */}
      <main className="py-8">
        {quiz ? (
          <QuizRenderer
            key={currentQuiz}
            quiz={quiz}
            onComplete={(score, total) => {
              console.log(`Score: ${score}/${total}`);
            }}
          />
        ) : (
          <p className="text-center text-gray-500 mt-20">
            Keine Quizze verfügbar.
          </p>
        )}

        {/* Navigation */}
        {totalQuizzes > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setCurrentQuiz((p) => Math.max(0, p - 1))}
              disabled={currentQuiz === 0}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 disabled:opacity-40"
            >
              Zurück
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              {currentQuiz + 1} / {totalQuizzes}
            </span>
            <button
              onClick={() =>
                setCurrentQuiz((p) => Math.min(totalQuizzes - 1, p + 1))
              }
              disabled={currentQuiz === totalQuizzes - 1}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 disabled:opacity-40"
            >
              Weiter
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
