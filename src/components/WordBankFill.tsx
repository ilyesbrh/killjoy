import { useState, useCallback } from "react";
import type { WordBankFillQuiz, Blank, DialogueLine } from "../types/quiz";

interface Props {
  quiz: WordBankFillQuiz;
  onComplete?: (score: number, total: number) => void;
}

function isBlank(segment: string | Blank): segment is Blank {
  return typeof segment !== "string";
}

export default function WordBankFill({ quiz, onComplete }: Props) {
  // Track which word is placed in which blank: blankId -> word
  const [placements, setPlacements] = useState<Record<string, string>>({});
  // Track which word bank item is currently selected
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  // Track checked state
  const [checked, setChecked] = useState(false);

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
    const usedCount = placedWords
      .slice(0, placedWords.length)
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

      {/* Word Bank */}
      <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {bankAvailability.map(({ word, idx, isUsed }) => (
          <button
            key={idx}
            onClick={() => !isUsed && handleWordClick(word)}
            disabled={isUsed || checked}
            className={`
              px-3 py-1.5 rounded-md text-base font-medium transition-all
              ${
                isUsed
                  ? "bg-gray-200 text-gray-400 line-through cursor-default"
                  : selectedWord === word
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-800 border border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
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
            className="space-y-3 p-4 bg-white rounded-lg border border-gray-100"
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
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCheck}
          disabled={!allFilled || checked}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-base transition-all
            ${
              allFilled && !checked
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

      {/* Score feedback */}
      {checked && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-lg font-semibold text-blue-900">
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
          <span className="inline-block w-3 h-3 bg-gray-800 rounded-sm" />
        ) : (
          <span
            className="inline-block w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "10px solid #22c55e",
            }}
          />
        )}
      </span>

      {/* Segments */}
      <p className="text-lg leading-relaxed flex flex-wrap items-baseline">
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
    "inline-flex items-center justify-center min-w-[80px] px-2 py-0.5 mx-1 border-b-2 text-base font-medium transition-all cursor-pointer";

  const statusClasses = checked
    ? status === "correct"
      ? "border-green-500 bg-green-50 text-green-800"
      : status === "incorrect"
      ? "border-red-500 bg-red-50 text-red-800"
      : "border-gray-300 bg-gray-50 text-gray-400"
    : value
    ? "border-blue-400 bg-blue-50 text-blue-900 hover:bg-blue-100"
    : isTarget
    ? "border-blue-400 bg-blue-50 text-gray-400 animate-pulse"
    : "border-gray-300 bg-gray-50 text-gray-400";

  return (
    <span className={`${baseClasses} ${statusClasses}`} onClick={onClick}>
      {value || "\u00A0"}
      {checked && status === "incorrect" && (
        <span className="ml-2 text-xs text-green-600">({blank.answer})</span>
      )}
    </span>
  );
}
