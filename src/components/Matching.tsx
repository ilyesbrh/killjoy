import { useState, useCallback } from "react";
import type { MatchingQuiz } from "../types/quiz";

interface Props {
  quiz: MatchingQuiz;
  onComplete?: (score: number, total: number) => void;
}

export default function Matching({ quiz, onComplete }: Props) {
  const total = quiz.left.length;

  // pairs: leftIndex -> rightIndex
  const [pairs, setPairs] = useState<Record<number, number>>(() => {
    if (quiz.givenPair) return { [quiz.givenPair.left]: quiz.givenPair.right };
    return {};
  });
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const usedRightIndices = new Set(Object.values(pairs));

  const handleLeftClick = useCallback(
    (idx: number) => {
      if (checked) return;
      if (quiz.givenPair && idx === quiz.givenPair.left) return;

      // If already paired, unpair it
      if (pairs[idx] !== undefined) {
        setPairs((prev) => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
        setSelectedLeft(null);
        return;
      }

      setSelectedLeft((prev) => (prev === idx ? null : idx));
    },
    [checked, pairs, quiz.givenPair]
  );

  const handleRightClick = useCallback(
    (idx: number) => {
      if (checked) return;
      if (selectedLeft === null) return;

      // If this right is already used by given pair, skip
      if (
        quiz.givenPair &&
        usedRightIndices.has(idx) &&
        pairs[quiz.givenPair.left] === idx
      )
        return;

      // If this right is used by another left, remove that pairing first
      setPairs((prev) => {
        const next = { ...prev };
        for (const [l, r] of Object.entries(next)) {
          if (
            r === idx &&
            !(quiz.givenPair && Number(l) === quiz.givenPair.left)
          ) {
            delete next[Number(l)];
          }
        }
        next[selectedLeft!] = idx;
        return next;
      });
      setSelectedLeft(null);
    },
    [checked, selectedLeft, pairs, quiz.givenPair, usedRightIndices]
  );

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = Object.entries(quiz.correctPairs).filter(
        ([l, r]) => pairs[Number(l)] === r
      ).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    setPairs(() => {
      if (quiz.givenPair)
        return { [quiz.givenPair.left]: quiz.givenPair.right };
      return {};
    });
    setSelectedLeft(null);
    setChecked(false);
  };

  const allPaired = quiz.left.every((_, i) => pairs[i] !== undefined);

  const getPairStatus = (leftIdx: number) => {
    if (!checked) return "neutral";
    if (pairs[leftIdx] === undefined) return "empty";
    return pairs[leftIdx] === quiz.correctPairs[leftIdx]
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
            {quiz.instruction}
          </h2>
        </div>
        {quiz.section && (
          <div className="text-xs tracking-widest text-gray-400 uppercase">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Matching grid */}
      <div className="space-y-2">
        {quiz.left.map((item, lIdx) => {
          const isGiven =
            quiz.givenPair !== undefined && lIdx === quiz.givenPair.left;
          const pairedRight = pairs[lIdx];
          const status = getPairStatus(lIdx);
          const isSelected = selectedLeft === lIdx;

          return (
            <div key={lIdx} className="flex items-center gap-3">
              {/* Left item */}
              <button
                onClick={() => handleLeftClick(lIdx)}
                disabled={checked || isGiven}
                className={`
                  flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all
                  ${
                    checked
                      ? status === "correct"
                        ? "border-green-400 bg-green-50"
                        : status === "incorrect"
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-white"
                      : isSelected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : pairedRight !== undefined
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }
                  ${isGiven ? "cursor-default" : "cursor-pointer"}
                `}
              >
                <span className="text-sm font-bold text-gray-500 w-4">
                  {item.label}
                </span>
                <span className="text-base text-gray-800">{item.text}</span>
              </button>

              {/* Connector */}
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                {pairedRight !== undefined ? (
                  <div
                    className={`w-full h-0.5 ${
                      checked
                        ? status === "correct"
                          ? "bg-green-500"
                          : "bg-red-500"
                        : "bg-blue-400"
                    }`}
                  />
                ) : (
                  <div className="w-full h-0.5 bg-gray-200 border-dashed border-t border-gray-300" />
                )}
              </div>

              {/* Right item (shows the matched one, or a placeholder) */}
              <button
                onClick={() => {
                  if (pairedRight !== undefined) {
                    // Clicking the right side of a pair — do nothing, click left to unpair
                  }
                }}
                className={`
                  flex-1 px-4 py-3 rounded-lg border text-left transition-all
                  ${
                    pairedRight !== undefined
                      ? checked
                        ? status === "correct"
                          ? "border-green-400 bg-green-50"
                          : "border-red-400 bg-red-50"
                        : "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }
                `}
              >
                <span className="text-base">
                  {pairedRight !== undefined ? quiz.right[pairedRight] : "..."}
                </span>
                {checked && status === "incorrect" && (
                  <span className="ml-2 text-xs text-green-600">
                    ({quiz.right[quiz.correctPairs[lIdx]]})
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Available right items to pick from */}
      {selectedLeft !== null && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-500 mb-2">Wählen Sie:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.right.map((text, rIdx) => {
              const isUsed = usedRightIndices.has(rIdx);
              return (
                <button
                  key={rIdx}
                  onClick={() => handleRightClick(rIdx)}
                  disabled={isUsed}
                  className={`
                    px-3 py-2 rounded-lg border text-sm transition-all
                    ${
                      isUsed
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default line-through"
                        : "bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                    }
                  `}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCheck}
          disabled={!allPaired || checked}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-base transition-all
            ${
              allPaired && !checked
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
              Object.entries(quiz.correctPairs).filter(
                ([l, r]) => pairs[Number(l)] === r
              ).length
            }{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}
