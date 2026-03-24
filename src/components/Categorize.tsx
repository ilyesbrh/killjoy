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
          {quiz.title || quiz.instruction}
        </h2>
        {quiz.title && (
          <p className="text-sm font-bold text-duo-gray-dark mt-1">{quiz.instruction}</p>
        )}
        {quiz.section && (
          <div className="text-xs font-bold text-duo-gray tracking-wider uppercase mt-1">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {quiz.items.map((item, iIdx) => {
          const assigned = assignments[iIdx];
          const status = getStatus(iIdx);
          const given = isGiven(iIdx);

          return (
            <div key={iIdx} className="flex flex-col items-center gap-2">
              {/* Image or placeholder */}
              <div
                className={`
                  w-full aspect-[4/3] rounded-xl border-2 flex items-center justify-center overflow-hidden relative
                  ${
                    checked
                      ? status === "correct"
                        ? "border-duo-green"
                        : status === "incorrect"
                        ? "border-duo-red"
                        : "border-gray-200"
                      : assigned !== undefined
                      ? "border-duo-blue"
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
                  <span className="text-sm text-duo-gray-dark text-center px-2">
                    {item.description || `Bild ${item.label}`}
                  </span>
                )}
                <span className="absolute top-1 left-1 bg-duo-text text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
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
                      flex-1 py-1.5 text-xs font-extrabold rounded-xl border-2 transition-all
                      ${
                        assigned === cIdx
                          ? checked
                            ? status === "correct"
                              ? "bg-duo-green text-white border-duo-green-dark"
                              : "bg-duo-red text-white border-duo-red-dark"
                            : given
                            ? "bg-duo-text text-white border-duo-text cursor-default"
                            : "bg-duo-blue text-white border-duo-blue-dark cursor-pointer"
                          : "bg-gray-100 text-duo-gray-dark border-gray-200 cursor-pointer"
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
                <span className="text-xs text-duo-green-dark font-bold">
                  = {quiz.categories[quiz.items[iIdx].correctCategory]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Category summary */}
      <div className="flex gap-3 mb-5">
        {quiz.categories.map((cat, cIdx) => {
          const itemsInCat = quiz.items
            .map((_, i) => i)
            .filter((i) => assignments[i] === cIdx);
          return (
            <div
              key={cIdx}
              className="flex-1 p-3 bg-white rounded-2xl border-2 border-gray-200"
            >
              <p className="text-sm font-extrabold text-duo-text mb-1">{cat}:</p>
              <p className="text-sm font-bold text-duo-gray-dark">
                {itemsInCat.length > 0
                  ? itemsInCat.map((i) => quiz.items[i].label).join(", ")
                  : "\u2014"}
              </p>
            </div>
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

      {/* Score feedback */}
      {checked && (
        <div className="mt-4 p-4 rounded-2xl bg-duo-green-light border-2 border-duo-green">
          <p className="text-base font-extrabold text-duo-green-dark">
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
