import { useState, useCallback, useRef, useEffect } from "react";
import type { MatchingQuiz } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: MatchingQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

interface Coords {
  x: number;
  y: number;
}

export default function Matching({ quiz, onComplete, onReset, stateKey }: Props) {
  const total = quiz.left.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [pairs, setPairs] = useQuizState<Record<number, number>>(
    stateKey ? `${stateKey}-p` : undefined,
    () => {
      if (quiz.givenPair) return { [quiz.givenPair.left]: quiz.givenPair.right };
      return {};
    }
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);
  const [lineCoords, setLineCoords] = useState<
    { from: Coords; to: Coords; leftIdx: number }[]
  >([]);

  const usedRightIndices = new Set(Object.values(pairs));

  // Recompute SVG line coordinates whenever pairs change
  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const coords: { from: Coords; to: Coords; leftIdx: number }[] = [];

    for (const [l, r] of Object.entries(pairs)) {
      const lEl = leftRefs.current[Number(l)];
      const rEl = rightRefs.current[r];
      if (!lEl || !rEl) continue;
      const lRect = lEl.getBoundingClientRect();
      const rRect = rEl.getBoundingClientRect();
      coords.push({
        leftIdx: Number(l),
        from: {
          x: lRect.right - containerRect.left,
          y: lRect.top + lRect.height / 2 - containerRect.top,
        },
        to: {
          x: rRect.left - containerRect.left,
          y: rRect.top + rRect.height / 2 - containerRect.top,
        },
      });
    }
    setLineCoords(coords);
  }, [pairs]);

  useEffect(() => {
    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [updateLines]);

  const tryPair = useCallback(
    (lIdx: number, rIdx: number) => {
      if (checked) return;
      const isGivenLeft =
        quiz.givenPair !== undefined && lIdx === quiz.givenPair.left;
      const isGivenRight =
        quiz.givenPair !== undefined && rIdx === quiz.givenPair.right;
      if (isGivenLeft || isGivenRight) {
        setSelectedLeft(null);
        setSelectedRight(null);
        return;
      }

      setPairs((prev) => {
        const next = { ...prev };
        // Remove any existing pair using this right
        for (const [l, r] of Object.entries(next)) {
          if (
            r === rIdx &&
            !(quiz.givenPair && Number(l) === quiz.givenPair.left)
          ) {
            delete next[Number(l)];
          }
        }
        // Remove any existing pair from this left
        delete next[lIdx];
        next[lIdx] = rIdx;
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    },
    [checked, quiz.givenPair]
  );

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
        setSelectedRight(null);
        return;
      }

      // If a right is already selected, make the pair
      if (selectedRight !== null) {
        tryPair(idx, selectedRight);
        return;
      }

      setSelectedLeft((prev) => (prev === idx ? null : idx));
      setSelectedRight(null);
    },
    [checked, pairs, quiz.givenPair, selectedRight, tryPair]
  );

  const handleRightClick = useCallback(
    (idx: number) => {
      if (checked) return;
      if (quiz.givenPair && idx === quiz.givenPair.right) return;

      // If this right is already used, unpair it
      const pairedLeft = Object.entries(pairs).find(([, r]) => r === idx);
      if (pairedLeft) {
        const lIdx = Number(pairedLeft[0]);
        if (quiz.givenPair && lIdx === quiz.givenPair.left) return;
        setPairs((prev) => {
          const next = { ...prev };
          delete next[lIdx];
          return next;
        });
        setSelectedLeft(null);
        setSelectedRight(null);
        return;
      }

      // If a left is already selected, make the pair
      if (selectedLeft !== null) {
        tryPair(selectedLeft, idx);
        return;
      }

      setSelectedRight((prev) => (prev === idx ? null : idx));
      setSelectedLeft(null);
    },
    [checked, pairs, quiz.givenPair, selectedLeft, tryPair]
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
    setSelectedRight(null);
    setChecked(false);
    onReset?.();
  };

  const allPaired = quiz.left.every((_, i) => pairs[i] !== undefined);

  const getPairStatus = (leftIdx: number) => {
    if (!checked) return "neutral";
    if (pairs[leftIdx] === undefined) return "empty";
    return pairs[leftIdx] === quiz.correctPairs[leftIdx]
      ? "correct"
      : "incorrect";
  };

  const getLineColor = (leftIdx: number) => {
    if (!checked) return "#3b82f6"; // blue-500
    return getPairStatus(leftIdx) === "correct" ? "#22c55e" : "#ef4444";
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

      {/* Two-column matching area with SVG lines */}
      <div ref={containerRef} className="relative">
        {/* SVG overlay for lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {lineCoords.map(({ from, to, leftIdx }) => (
            <line
              key={leftIdx}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={getLineColor(leftIdx)}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="flex gap-12">
          {/* Left column */}
          <div className="flex-1 space-y-2">
            {quiz.left.map((item, lIdx) => {
              const isGiven =
                quiz.givenPair !== undefined && lIdx === quiz.givenPair.left;
              const isPaired = pairs[lIdx] !== undefined;
              const isSelected = selectedLeft === lIdx;
              const status = getPairStatus(lIdx);

              return (
                <button
                  key={lIdx}
                  ref={(el) => {
                    leftRefs.current[lIdx] = el;
                  }}
                  onClick={() => handleLeftClick(lIdx)}
                  disabled={checked || isGiven}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-green-400 bg-green-50"
                          : status === "incorrect"
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white"
                        : isSelected
                        ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                        : isPaired
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }
                    ${isGiven ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  <span className="text-sm font-bold text-gray-400 w-4">
                    {item.label}
                  </span>
                  <span className="text-base text-gray-800">{item.text}</span>
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex-1 space-y-2">
            {quiz.right.map((text, rIdx) => {
              const isGiven =
                quiz.givenPair !== undefined && rIdx === quiz.givenPair.right;
              const isUsed = usedRightIndices.has(rIdx);
              const isSelected = selectedRight === rIdx;

              // Find which left is paired to this right (for status)
              const pairedLeftIdx = Object.entries(pairs).find(
                ([, r]) => r === rIdx
              );
              const status = pairedLeftIdx
                ? getPairStatus(Number(pairedLeftIdx[0]))
                : "neutral";

              return (
                <button
                  key={rIdx}
                  ref={(el) => {
                    rightRefs.current[rIdx] = el;
                  }}
                  onClick={() => handleRightClick(rIdx)}
                  disabled={checked || isGiven}
                  className={`
                    w-full px-4 py-3 rounded-lg border text-left transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-green-400 bg-green-50"
                          : status === "incorrect"
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white"
                        : isSelected
                        ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                        : isUsed
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }
                    ${isGiven ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  <span className="text-base text-gray-800">{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
