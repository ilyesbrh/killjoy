import type { WriteSentencesQuiz } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: WriteSentencesQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

export default function WriteSentences({ quiz, onComplete, onReset, stateKey }: Props) {
  const total = quiz.cards.length;

  const [answers, setAnswers] = useQuizState<Record<number, string>>(stateKey ? `${stateKey}-a` : undefined, () => {
    const init: Record<number, string> = {};
    if (quiz.givenCard !== undefined) {
      init[quiz.givenCard] = quiz.cards[quiz.givenCard].expectedSentences.join(" ");
    }
    return init;
  });
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const isGiven = (idx: number) => quiz.givenCard === idx;

  const handleChange = (idx: number, value: string) => {
    if (checked || isGiven(idx)) return;
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();

  const isCorrect = (idx: number) => {
    const answer = answers[idx];
    if (!answer) return false;
    const expected = quiz.cards[idx].expectedSentences.join(" ");
    return normalize(answer) === normalize(expected);
  };

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = quiz.cards.filter((_, i) => isCorrect(i)).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    const init: Record<number, string> = {};
    if (quiz.givenCard !== undefined) {
      init[quiz.givenCard] = quiz.cards[quiz.givenCard].expectedSentences.join(" ");
    }
    setAnswers(init);
    setChecked(false);
    onReset?.();
  };

  const allFilled = quiz.cards.every(
    (_, i) => isGiven(i) || (answers[i] && answers[i].trim().length > 0)
  );

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

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {quiz.cards.map((card, idx) => {
          const given = isGiven(idx);
          const correct = checked && isCorrect(idx);
          const incorrect = checked && !isCorrect(idx);

          return (
            <div
              key={idx}
              className={`rounded-lg border-2 overflow-hidden transition-all ${
                checked
                  ? correct
                    ? "border-green-400"
                    : incorrect
                    ? "border-red-400"
                    : "border-gray-200"
                  : given
                  ? "border-gray-300"
                  : "border-gray-200"
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    {card.name}
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {card.label}
                </span>
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-3 py-1.5 font-medium">
                  {card.name} / {card.country}
                </span>
              </div>

              {/* Text area */}
              <div className="p-3">
                {given ? (
                  <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
                    {answers[idx]}
                  </p>
                ) : (
                  <textarea
                    value={answers[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    disabled={checked}
                    placeholder="Das ist..."
                    rows={2}
                    className={`w-full text-sm p-2 rounded border resize-none transition-all ${
                      checked
                        ? correct
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                        : "border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    }`}
                  />
                )}
                {checked && incorrect && !given && (
                  <p className="text-xs text-green-600 mt-1">
                    = {quiz.cards[idx].expectedSentences.join(" ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
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
            {quiz.cards.filter((_, i) => isCorrect(i)).length} / {total}{" "}
            richtig!
          </p>
        </div>
      )}
    </div>
  );
}
