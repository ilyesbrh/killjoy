import { useState, useCallback } from "react";
import type { ImageWordBankQuiz } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: ImageWordBankQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

export default function ImageWordBank({ quiz, onComplete, onReset, stateKey }: Props) {
  const total = quiz.cards.length;

  // cardIndex -> word placed
  const [placements, setPlacements] = useQuizState<Record<number, string>>(stateKey ? `${stateKey}-p` : undefined, () => {
    if (quiz.givenCard !== undefined)
      return { [quiz.givenCard]: quiz.cards[quiz.givenCard].answer };
    return {};
  });
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const placedWords = Object.values(placements);

  // Track availability per word in bank
  const bankAvailability = quiz.wordBank.map((word, idx) => {
    const totalInBank = quiz.wordBank
      .slice(0, idx + 1)
      .filter((w) => w === word).length;
    const occurrencesUsed = placedWords.filter((w) => w === word).length;
    const thisOccurrenceIndex = totalInBank - 1;
    const isUsed = thisOccurrenceIndex < occurrencesUsed;
    return { word, idx, isUsed };
  });

  const handleWordClick = useCallback(
    (word: string) => {
      if (checked) return;
      setSelectedWord((prev) => (prev === word ? null : word));
    },
    [checked]
  );

  const handleCardClick = useCallback(
    (cardIdx: number) => {
      if (checked) return;
      if (quiz.givenCard !== undefined && cardIdx === quiz.givenCard) return;

      // If card already has a word, remove it
      if (placements[cardIdx] !== undefined) {
        setPlacements((prev) => {
          const next = { ...prev };
          delete next[cardIdx];
          return next;
        });
        return;
      }

      // If a word is selected, place it
      if (selectedWord) {
        setPlacements((prev) => ({ ...prev, [cardIdx]: selectedWord }));
        setSelectedWord(null);
      }
    },
    [checked, selectedWord, placements, quiz.givenCard]
  );

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = quiz.cards.filter(
        (card, i) =>
          placements[i]?.toLowerCase() === card.answer.toLowerCase()
      ).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    setPlacements(() => {
      if (quiz.givenCard !== undefined)
        return { [quiz.givenCard]: quiz.cards[quiz.givenCard].answer };
      return {};
    });
    setSelectedWord(null);
    setChecked(false);
    onReset?.();
  };

  const allFilled = quiz.cards.every((_, i) => placements[i] !== undefined);

  const getStatus = (cardIdx: number) => {
    if (!checked) return "neutral";
    if (placements[cardIdx] === undefined) return "empty";
    return placements[cardIdx].toLowerCase() ===
      quiz.cards[cardIdx].answer.toLowerCase()
      ? "correct"
      : "incorrect";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
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
        {quiz.section && (
          <div className="text-xs tracking-widest text-gray-400 uppercase">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Instruction + Word Bank */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-base text-gray-700 mb-3 font-medium">
          {quiz.title ? quiz.instruction : ""}
        </p>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {quiz.cards.map((card, cIdx) => {
          const isGiven =
            quiz.givenCard !== undefined && cIdx === quiz.givenCard;
          const placed = placements[cIdx];
          const status = getStatus(cIdx);
          const isTarget = !placed && !!selectedWord;

          return (
            <button
              key={cIdx}
              onClick={() => handleCardClick(cIdx)}
              disabled={checked || isGiven}
              className={`
                flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all text-center
                ${
                  checked
                    ? status === "correct"
                      ? "border-green-400 bg-green-50"
                      : status === "incorrect"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
                    : placed
                    ? "border-blue-400 bg-blue-50"
                    : isTarget
                    ? "border-blue-300 bg-blue-50 animate-pulse"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }
                ${isGiven ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {/* Image or placeholder */}
              <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">
                    {getLandmarkEmoji(card.caption)}
                  </span>
                )}
                <span className="absolute top-1 left-1 bg-gray-800 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center">
                  {card.label}
                </span>
              </div>

              {/* Caption */}
              <div className="px-2 py-2 w-full">
                <p className="text-sm font-medium text-gray-700">
                  {card.caption}
                </p>

                {/* Answer slot */}
                <div
                  className={`
                    mt-1 min-h-[28px] border-b-2 text-sm font-semibold px-1 py-0.5 transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-green-500 text-green-700"
                          : status === "incorrect"
                          ? "border-red-500 text-red-700"
                          : "border-gray-300 text-gray-400"
                        : placed
                        ? "border-blue-400 text-blue-700"
                        : "border-gray-300 text-gray-400"
                    }
                  `}
                >
                  {placed || "\u00A0"}
                  {checked && status === "incorrect" && (
                    <span className="block text-xs text-green-600">
                      {card.answer}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
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

      {/* Score */}
      {checked && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-lg font-semibold text-blue-900">
            {
              quiz.cards.filter(
                (card, i) =>
                  placements[i]?.toLowerCase() === card.answer.toLowerCase()
              ).length
            }{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}

function getLandmarkEmoji(caption: string): string {
  const map: Record<string, string> = {
    "Brandenburger Tor": "\uD83C\uDFDB\uFE0F",
    Eiffelturm: "\uD83D\uDDFC",
    Stephansdom: "\u26EA",
    Matterhorn: "\uD83C\uDFD4\uFE0F",
    "Hagia Sophia": "\uD83D\uDD4C",
  };
  return map[caption] || "\uD83D\uDDBC\uFE0F";
}
