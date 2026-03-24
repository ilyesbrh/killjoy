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
    if (!checked) return "#1CB0F6"; // duo-blue
    return getPairStatus(leftIdx) === "correct" ? "#58CC02" : "#FF4B4B";
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

        <div className="flex gap-8">
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
                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-duo-green bg-duo-green-light"
                          : status === "incorrect"
                          ? "border-duo-red bg-duo-red/10"
                          : "border-gray-200 bg-white"
                        : isSelected
                        ? "border-duo-blue bg-duo-blue/10 ring-2 ring-duo-blue/30"
                        : isPaired
                        ? "border-duo-blue/60 bg-duo-blue/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                    ${isGiven ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  <span className="text-sm font-black text-duo-gray w-5">
                    {item.label}
                  </span>
                  <span className="text-base font-bold text-duo-text">{item.text}</span>
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
                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-duo-green bg-duo-green-light"
                          : status === "incorrect"
                          ? "border-duo-red bg-duo-red/10"
                          : "border-gray-200 bg-white"
                        : isSelected
                        ? "border-duo-blue bg-duo-blue/10 ring-2 ring-duo-blue/30"
                        : isUsed
                        ? "border-duo-blue/60 bg-duo-blue/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                    ${isGiven ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  <span className="text-base font-bold text-duo-text">{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCheck}
          disabled={!allPaired || checked}
          className={`btn-3d flex-1 py-3 rounded-2xl font-extrabold text-base uppercase tracking-wide border-b-4 transition-all ${
            allPaired && !checked
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
