import { useCallback } from "react";
import type { ReorderQuiz } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: ReorderQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

export default function Reorder({ quiz, onComplete, onReset, stateKey }: Props) {
  const total = quiz.sentences.length;

  const [assignments, setAssignments] = useQuizState<(number | null)[]>(
    stateKey ? `${stateKey}-a` : undefined,
    () => quiz.sentences.map((_, i) => {
      if (quiz.givenFirst !== undefined && i === quiz.givenFirst) return 1;
      return null;
    })
  );
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const handleClick = useCallback(
    (idx: number) => {
      if (checked) return;
      // If this sentence is the given hint, skip
      if (quiz.givenFirst !== undefined && idx === quiz.givenFirst) return;

      setAssignments((prev) => {
        const current = prev[idx];
        if (current !== null) {
          // Remove this assignment and shift down numbers above it
          return prev.map((a) => {
            if (a === null) return null;
            if (a === current) return null;
            if (a > current) return a - 1;
            return a;
          });
        }
        // Assign next number
        const next = Math.max(0, ...prev.map((a) => a ?? 0)) + 1;
        const updated = [...prev];
        updated[idx] = next;
        return updated;
      });
    },
    [checked, quiz.givenFirst]
  );

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      // Build user's order: sort sentences by their assigned number
      const userOrder = assignments
        .map((num, idx) => ({ num, idx }))
        .filter((x) => x.num !== null)
        .sort((a, b) => a.num! - b.num!)
        .map((x) => x.idx);

      const score = userOrder.filter(
        (sentIdx, pos) => quiz.correctOrder[pos] === sentIdx
      ).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    setAssignments(
      quiz.sentences.map((_, i) => {
        if (quiz.givenFirst !== undefined && i === quiz.givenFirst) return 1;
        return null;
      })
    );
    setChecked(false);
    onReset?.();
  };

  const allAssigned = assignments.every((a) => a !== null);

  // For showing results: check each sentence's position
  const getStatus = (idx: number) => {
    if (!checked) return "neutral";
    const userNum = assignments[idx];
    if (userNum === null) return "empty";
    // The sentence at position (userNum - 1) in correct order should be idx
    return quiz.correctOrder[userNum - 1] === idx ? "correct" : "incorrect";
  };

  // Build correct number for showing after check
  const getCorrectNumber = (idx: number) => {
    return quiz.correctOrder.indexOf(idx) + 1;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {quiz.reference && (
            <span className="text-sm text-gray-500 font-medium">
              {quiz.reference}
            </span>
          )}
          <span className="bg-yellow-400 text-black font-bold text-sm px-2 py-0.5 rounded">
            {quiz.exerciseNumber}
          </span>
          <h2 className="text-xl font-bold text-gray-900">
            {quiz.instruction}
          </h2>
        </div>
        {quiz.section && (
          <div className="text-xs tracking-widest text-gray-400 uppercase">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {quiz.sentences.map((sentence, idx) => {
          const num = assignments[idx];
          const isGiven =
            quiz.givenFirst !== undefined && idx === quiz.givenFirst;
          const status = getStatus(idx);

          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={checked || isGiven}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-all
                ${
                  checked
                    ? status === "correct"
                      ? "border-green-400 bg-green-50"
                      : status === "incorrect"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
                    : num !== null
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                }
                ${isGiven ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {/* Number circle */}
              <span
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${
                    checked
                      ? status === "correct"
                        ? "border-green-500 bg-green-500 text-white"
                        : status === "incorrect"
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-gray-300 text-gray-400"
                      : num !== null
                      ? isGiven
                        ? "border-gray-800 bg-gray-800 text-white"
                        : "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 text-gray-400"
                  }
                `}
              >
                {num ?? ""}
              </span>

              {/* Sentence text */}
              <span className="text-base text-gray-800 flex-1">{sentence}</span>

              {/* Show correct number on wrong answers */}
              {checked && status === "incorrect" && (
                <span className="text-xs text-green-600 font-semibold flex-shrink-0">
                  = {getCorrectNumber(idx)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCheck}
          disabled={!allAssigned || checked}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-base transition-all
            ${
              allAssigned && !checked
                ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Prüfen
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-lg font-semibold text-base bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
        >
          Nochmal
        </button>
      </div>

      {/* Score */}
      {checked && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-lg font-semibold text-blue-900">
            {quiz.sentences.filter((_, i) => getStatus(i) === "correct").length}{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}
