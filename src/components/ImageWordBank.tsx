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
        {quiz.section && (
          <div className="text-xs font-bold text-duo-gray tracking-wider uppercase mt-1">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Instruction + Word Bank */}
      <div className="mb-6 p-4 bg-white rounded-2xl border-2 border-gray-200">
        {quiz.title && (
          <p className="text-base text-duo-gray-dark mb-3 font-bold">
            {quiz.instruction}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all text-center
                ${
                  checked
                    ? status === "correct"
                      ? "border-duo-green bg-duo-green-light"
                      : status === "incorrect"
                      ? "border-duo-red bg-duo-red/10"
                      : "border-gray-200 bg-white"
                    : placed
                    ? "border-duo-blue/60 bg-duo-blue/5"
                    : isTarget
                    ? "border-duo-blue bg-duo-blue/5 animate-pulse"
                    : "border-gray-200 bg-white hover:border-gray-300"
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
                <span className="absolute top-1 left-1 bg-duo-text text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {card.label}
                </span>
              </div>

              {/* Caption */}
              <div className="px-2 py-2 w-full">
                <p className="text-sm font-bold text-duo-text">
                  {card.caption}
                </p>

                {/* Answer slot */}
                <div
                  className={`
                    mt-1 min-h-[28px] border-b-2 text-sm font-bold px-1 py-0.5 transition-all
                    ${
                      checked
                        ? status === "correct"
                          ? "border-duo-green text-duo-green-dark"
                          : status === "incorrect"
                          ? "border-duo-red text-duo-red-dark"
                          : "border-gray-300 text-duo-gray"
                        : placed
                        ? "border-duo-blue text-duo-blue-dark"
                        : "border-gray-300 text-duo-gray"
                    }
                  `}
                >
                  {placed || "\u00A0"}
                  {checked && status === "incorrect" && (
                    <span className="block text-xs font-bold text-duo-green-dark">
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
