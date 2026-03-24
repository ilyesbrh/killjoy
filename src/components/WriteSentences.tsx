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
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {quiz.reference && (
            <span className="text-sm text-duo-gray-dark font-bold">
              {quiz.reference}
            </span>
          )}
          <span className="bg-duo-gold text-white font-black text-sm px-2.5 py-0.5 rounded-full">
            {quiz.exerciseNumber}
          </span>
          <h2 className="text-xl font-extrabold text-duo-text">
            {quiz.title || quiz.instruction}
          </h2>
        </div>
        {quiz.title && (
          <p className="text-base text-duo-gray-dark font-bold">{quiz.instruction}</p>
        )}
        {quiz.section && (
          <div className="text-xs tracking-widest text-duo-gray uppercase mt-1 font-bold">
            {quiz.section}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {quiz.cards.map((card, idx) => {
          const given = isGiven(idx);
          const correct = checked && isCorrect(idx);
          const incorrect = checked && !isCorrect(idx);

          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                checked
                  ? correct
                    ? "border-duo-green"
                    : incorrect
                    ? "border-duo-red"
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
                  <div className="w-full h-full flex items-center justify-center text-duo-gray text-sm font-bold">
                    {card.name}
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-duo-text text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center">
                  {card.label}
                </span>
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-3 py-1.5 font-bold">
                  {card.name} / {card.country}
                </span>
              </div>

              {/* Text area */}
              <div className="p-3">
                {given ? (
                  <p className="text-sm text-duo-gray-dark italic bg-duo-surface p-2 rounded-xl font-bold">
                    {answers[idx]}
                  </p>
                ) : (
                  <textarea
                    value={answers[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    disabled={checked}
                    placeholder="Das ist..."
                    rows={2}
                    className={`w-full text-sm p-3 rounded-xl border-2 resize-none transition-all font-bold ${
                      checked
                        ? correct
                          ? "border-duo-green bg-duo-green-light"
                          : "border-duo-red bg-duo-red/10"
                        : "border-gray-200 focus:border-duo-blue focus:ring-2 focus:ring-duo-blue/20"
                    }`}
                  />
                )}
                {checked && incorrect && !given && (
                  <p className="text-xs text-duo-green-dark font-bold mt-1">
                    = {quiz.cards[idx].expectedSentences.join(" ")}
                  </p>
                )}
              </div>
            </div>
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

      {/* Score */}
      {checked && (
        <div className="mt-4 p-4 rounded-2xl bg-duo-green-light border-2 border-duo-green">
          <p className="text-base font-extrabold text-duo-green-dark">
            {quiz.cards.filter((_, i) => isCorrect(i)).length} / {total}{" "}
            richtig!
          </p>
        </div>
      )}
    </div>
  );
}
