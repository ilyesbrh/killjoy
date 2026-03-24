import { useState, useCallback } from "react";
import type { WordBankFillQuiz, Blank, DialogueLine } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: WordBankFillQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

function isBlank(segment: string | Blank): segment is Blank {
  return typeof segment !== "string";
}

export default function WordBankFill({ quiz, onComplete, onReset, stateKey }: Props) {
  const [placements, setPlacements] = useQuizState<Record<string, string>>(stateKey ? `${stateKey}-p` : undefined, {});
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Collect all blanks for scoring
  const allBlanks: Blank[] = quiz.dialogues
    .flat()
    .flatMap((line) => line.segments.filter(isBlank));

  // Words currently placed (to grey them out in the bank)
  const placedWords = Object.values(placements);

  // Build available count per word in bank
  const bankAvailability = quiz.wordBank.map((word, idx) => {
    const totalInBank = quiz.wordBank
      .slice(0, idx + 1)
      .filter((w) => w === word).length;
    // For duplicate words, track per-occurrence
    const occurrencesUsed = placedWords.filter((w) => w === word).length;
    const occurrencesInBank = quiz.wordBank.filter((w) => w === word).length;
    const thisOccurrenceIndex = totalInBank - 1;
    const isUsed = thisOccurrenceIndex < occurrencesUsed;
    return { word, idx, isUsed, occurrencesInBank, occurrencesUsed };
  });

  const handleWordClick = useCallback(
    (word: string) => {
      if (checked) return;
      if (selectedWord === word) {
        setSelectedWord(null);
      } else {
        setSelectedWord(word);
      }
    },
    [selectedWord, checked]
  );

  const handleBlankClick = useCallback(
    (blankId: string) => {
      if (checked) return;

      // If blank already has a word, remove it (put back in bank)
      if (placements[blankId]) {
        setPlacements((prev) => {
          const next = { ...prev };
          delete next[blankId];
          return next;
        });
        return;
      }

      // If a word is selected, place it
      if (selectedWord) {
        setPlacements((prev) => ({ ...prev, [blankId]: selectedWord }));
        setSelectedWord(null);
      }
    },
    [selectedWord, placements, checked]
  );

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = allBlanks.filter(
        (b) =>
          placements[b.id]?.toLowerCase() === b.answer.toLowerCase()
      ).length;
      onComplete(score, allBlanks.length);
    }
  };

  const handleReset = () => {
    setPlacements({});
    setSelectedWord(null);
    setChecked(false);
    onReset?.();
  };

  const getBlankStatus = (blank: Blank) => {
    if (!checked) return "neutral";
    if (!placements[blank.id]) return "empty";
    return placements[blank.id].toLowerCase() === blank.answer.toLowerCase()
      ? "correct"
      : "incorrect";
  };

  const allFilled = allBlanks.every((b) => placements[b.id]);

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

      {/* Word Bank */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-2xl border-2 border-gray-200">
        {bankAvailability.map(({ word, idx, isUsed }) => (
          <button
            key={idx}
            onClick={() => !isUsed && handleWordClick(word)}
            disabled={isUsed || checked}
            className={`
              ${
                isUsed
                  ? "px-4 py-2 rounded-xl text-base font-bold bg-gray-100 text-duo-gray line-through cursor-default"
                  : selectedWord === word
                  ? "btn-3d px-4 py-2 rounded-xl text-base font-bold border-2 border-duo-blue border-b-4 border-b-duo-blue-dark bg-duo-blue text-white shadow-md"
                  : "btn-3d px-4 py-2 rounded-xl text-base font-bold border-2 border-gray-200 border-b-4 border-b-gray-300 bg-white text-duo-text cursor-pointer"
              }
            `}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Dialogues */}
      <div className="space-y-6">
        {quiz.dialogues.map((dialogue, dIdx) => (
          <div
            key={dIdx}
            className="space-y-3 p-4 bg-white rounded-2xl border-2 border-gray-200"
          >
            {dialogue.map((line, lIdx) => (
              <DialogueLineView
                key={lIdx}
                line={line}
                placements={placements}
                selectedWord={selectedWord}
                checked={checked}
                getBlankStatus={getBlankStatus}
                onBlankClick={handleBlankClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCheck}
          disabled={!allFilled || checked}
          className={`btn-3d flex-1 py-3 rounded-2xl font-extrabold text-base uppercase tracking-wide border-b-4 transition-all ${
            allFilled && !checked
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
            {allBlanks.filter(
              (b) =>
                placements[b.id]?.toLowerCase() === b.answer.toLowerCase()
            ).length}{" "}
            / {allBlanks.length} richtig!
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function DialogueLineView({
  line,
  placements,
  selectedWord,
  checked,
  getBlankStatus,
  onBlankClick,
}: {
  line: DialogueLine;
  placements: Record<string, string>;
  selectedWord: string | null;
  checked: boolean;
  getBlankStatus: (blank: Blank) => string;
  onBlankClick: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Speaker icon */}
      <span className="mt-1 flex-shrink-0">
        {line.speaker === "square" ? (
          <span className="inline-block w-3.5 h-3.5 bg-duo-text rounded-sm" />
        ) : (
          <span
            className="inline-block w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "10px solid #58CC02",
            }}
          />
        )}
      </span>

      {/* Segments */}
      <p className="text-base leading-relaxed flex flex-wrap items-baseline">
        {line.segments.map((seg, sIdx) =>
          isBlank(seg) ? (
            <BlankSlot
              key={seg.id}
              blank={seg}
              value={placements[seg.id]}
              status={getBlankStatus(seg)}
              isTarget={!placements[seg.id] && !!selectedWord}
              checked={checked}
              onClick={() => onBlankClick(seg.id)}
            />
          ) : (
            <span key={sIdx}>{seg}</span>
          )
        )}
      </p>
    </div>
  );
}

function BlankSlot({
  blank,
  value,
  status,
  isTarget,
  checked,
  onClick,
}: {
  blank: Blank;
  value?: string;
  status: string;
  isTarget: boolean;
  checked: boolean;
  onClick: () => void;
}) {
  const baseClasses =
    "inline-flex items-center justify-center min-w-[80px] px-2 py-0.5 mx-1 text-base font-bold transition-all cursor-pointer rounded-lg";

  const statusClasses = checked
    ? status === "correct"
      ? "border-b-2 border-duo-green bg-duo-green-light text-duo-green-dark"
      : status === "incorrect"
      ? "border-b-2 border-duo-red bg-duo-red/10 text-duo-red-dark"
      : "border-b-2 border-gray-300 bg-duo-surface text-duo-gray"
    : value
    ? "border-b-2 border-duo-blue bg-duo-blue/10 text-duo-blue-dark"
    : isTarget
    ? "border-b-2 border-duo-blue bg-duo-blue/10 text-duo-gray animate-pulse"
    : "border-b-2 border-gray-300 bg-duo-surface text-duo-gray";

  return (
    <span className={`${baseClasses} ${statusClasses}`} onClick={onClick}>
      {value || "\u00A0"}
      {checked && status === "incorrect" && (
        <span className="ml-2 text-xs font-bold text-duo-green-dark">({blank.answer})</span>
      )}
    </span>
  );
}
