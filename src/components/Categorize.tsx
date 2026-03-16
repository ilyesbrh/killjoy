import { useCallback } from "react";
import type { CategorizeQuiz } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: CategorizeQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

export default function Categorize({ quiz, onComplete, onReset, stateKey }: Props) {
  const total = quiz.items.length;

  // assignments: itemIndex -> categoryIndex
  const [assignments, setAssignments] = useQuizState<Record<number, number>>(stateKey ? `${stateKey}-a` : undefined, () => {
    const init: Record<number, number> = {};
    if (quiz.givenItems) {
      for (const [item, cat] of quiz.givenItems) {
        init[item] = cat;
      }
    }
    return init;
  });
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const isGiven = (itemIdx: number) =>
    quiz.givenItems?.some(([i]) => i === itemIdx) ?? false;

  const handleAssign = useCallback(
    (itemIdx: number, catIdx: number) => {
      if (checked || isGiven(itemIdx)) return;
      setAssignments((prev) => {
        if (prev[itemIdx] === catIdx) {
          const next = { ...prev };
          delete next[itemIdx];
          return next;
        }
        return { ...prev, [itemIdx]: catIdx };
      });
    },
    [checked, quiz.givenItems]
  );

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = quiz.items.filter(
        (item, i) => assignments[i] === item.correctCategory
      ).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    const init: Record<number, number> = {};
    if (quiz.givenItems) {
      for (const [item, cat] of quiz.givenItems) {
        init[item] = cat;
      }
    }
    setAssignments(init);
    setChecked(false);
    onReset?.();
  };

  const allAssigned = quiz.items.every((_, i) => assignments[i] !== undefined);

  const getStatus = (itemIdx: number) => {
    if (!checked) return "neutral";
    if (assignments[itemIdx] === undefined) return "empty";
    return assignments[itemIdx] === quiz.items[itemIdx].correctCategory
      ? "correct"
      : "incorrect";
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
            {quiz.title || quiz.instruction}
          </h2>
        </div>
        {quiz.title && (
          <p className="text-base text-gray-600">{quiz.instruction}</p>
        )}
        {quiz.section && (
          <div className="text-xs tracking-widest text-gray-400 uppercase mt-1">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {quiz.items.map((item, iIdx) => {
          const assigned = assignments[iIdx];
          const status = getStatus(iIdx);
          const given = isGiven(iIdx);

          return (
            <div key={iIdx} className="flex flex-col items-center gap-2">
              {/* Image or placeholder */}
              <div
                className={`
                  w-full aspect-[4/3] rounded-lg border-2 flex items-center justify-center overflow-hidden relative
                  ${
                    checked
                      ? status === "correct"
                        ? "border-green-400"
                        : status === "incorrect"
                        ? "border-red-400"
                        : "border-gray-200"
                      : assigned !== undefined
                      ? "border-blue-400"
                      : "border-gray-200"
                  }
                `}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.description || item.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-500 text-center px-2">
                    {item.description || `Bild ${item.label}`}
                  </span>
                )}
                <span className="absolute top-1 left-1 bg-gray-800 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.label}
                </span>
              </div>

              {/* Category buttons */}
              <div className="flex gap-1 w-full">
                {quiz.categories.map((cat, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleAssign(iIdx, cIdx)}
                    disabled={checked || given}
                    className={`
                      flex-1 py-1.5 text-xs font-semibold rounded transition-all
                      ${
                        assigned === cIdx
                          ? checked
                            ? status === "correct"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                            : given
                            ? "bg-gray-700 text-white"
                            : "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                      ${given ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Show correct on wrong */}
              {checked && status === "incorrect" && (
                <span className="text-xs text-green-600">
                  = {quiz.categories[quiz.items[iIdx].correctCategory]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Category summary */}
      <div className="flex gap-4 mb-6">
        {quiz.categories.map((cat, cIdx) => {
          const itemsInCat = quiz.items
            .map((_, i) => i)
            .filter((i) => assignments[i] === cIdx);
          return (
            <div
              key={cIdx}
              className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <p className="text-sm font-bold text-gray-700 mb-1">{cat}:</p>
              <p className="text-sm text-gray-600">
                {itemsInCat.length > 0
                  ? itemsInCat.map((i) => quiz.items[i].label).join(", ")
                  : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
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
            {
              quiz.items.filter(
                (item, i) => assignments[i] === item.correctCategory
              ).length
            }{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}
