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
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1.5">
          {quiz.reference && (
            <span className="text-xs font-extrabold text-duo-gray-dark uppercase tracking-wider">
              {quiz.reference}
            </span>
          )}
          <span className="bg-duo-gold text-white font-black text-xs w-7 h-7 rounded-full flex items-center justify-center">
            {quiz.exerciseNumber}
          </span>
        </div>
        <h2 className="text-lg font-extrabold text-duo-text leading-snug">
          {quiz.instruction}
        </h2>
        {quiz.section && (
          <div className="text-xs font-bold text-duo-gray tracking-wider uppercase mt-1">
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
                w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left transition-all
                ${
                  checked
                    ? status === "correct"
                      ? "border-duo-green bg-duo-green-light"
                      : status === "incorrect"
                      ? "border-duo-red bg-duo-red/10"
                      : "border-gray-200 bg-white"
                    : isGiven
                    ? "border-gray-300 bg-gray-50 cursor-default"
                    : num !== null
                    ? "border-duo-blue/60 bg-duo-blue/5"
                    : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                }
              `}
            >
              {/* Number circle */}
              <span
                className={`
                  flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all
                  ${
                    checked
                      ? status === "correct"
                        ? "border-duo-green bg-duo-green text-white"
                        : status === "incorrect"
                        ? "border-duo-red bg-duo-red text-white"
                        : "border-gray-300 text-duo-gray"
                      : num !== null
                      ? isGiven
                        ? "border-duo-text bg-duo-text text-white"
                        : "border-duo-blue bg-duo-blue text-white"
                      : "border-gray-300 text-duo-gray"
                  }
                `}
              >
                {num ?? ""}
              </span>

              {/* Sentence text */}
              <span className="text-base font-bold text-duo-text flex-1">{sentence}</span>

              {/* Show correct number on wrong answers */}
              {checked && status === "incorrect" && (
                <span className="text-xs text-duo-green-dark font-extrabold flex-shrink-0">
                  = {getCorrectNumber(idx)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCheck}
          disabled={!allAssigned || checked}
          className={`btn-3d flex-1 py-3 rounded-2xl font-extrabold text-base uppercase tracking-wide border-b-4 transition-all ${
            allAssigned && !checked
              ? "bg-duo-green text-white border-duo-green-dark cursor-pointer"
              : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
          }`}
        >
          Prüfen
        </button>
        <button
          onClick={handleReset}
          className="btn-3d flex-1 py-3 rounded-2xl font-extrabold text-base uppercase tracking-wide border-b-4 bg-white text-duo-gray-dark border-gray-300 cursor-pointer"
        >
          Nochmal
        </button>
      </div>

      {/* Score */}
      {checked && (
        <div className="mt-4 p-4 rounded-2xl bg-duo-green-light border-2 border-duo-green">
          <p className="text-base font-extrabold text-duo-green-dark">
            {quiz.sentences.filter((_, i) => getStatus(i) === "correct").length}{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}
