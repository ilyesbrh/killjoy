import type {
  InlineChoiceQuiz,
  InlineChoice as InlineChoiceType,
} from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: InlineChoiceQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

function isChoice(
  segment: string | InlineChoiceType
): segment is InlineChoiceType {
  return typeof segment !== "string";
}

export default function InlineChoice({ quiz, onComplete, onReset, stateKey }: Props) {
  const allChoices: { qIdx: number; choice: InlineChoiceType }[] =
    quiz.questions.flatMap((q, qIdx) =>
      q.segments.filter(isChoice).map((choice) => ({ qIdx, choice }))
    );

  const total = allChoices.length;

  // answers: choiceId -> selected option index
  const [answers, setAnswers] = useQuizState<Record<string, number>>(stateKey ? `${stateKey}-a` : undefined, () => {
    const init: Record<string, number> = {};
    if (quiz.givenAnswer !== undefined) {
      const q = quiz.questions[quiz.givenAnswer];
      for (const seg of q.segments) {
        if (isChoice(seg)) {
          init[seg.id] = seg.correct;
        }
      }
    }
    return init;
  });
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const isGivenQuestion = (qIdx: number) => quiz.givenAnswer === qIdx;

  const handleSelect = (choiceId: string, optIdx: number, qIdx: number) => {
    if (checked || isGivenQuestion(qIdx)) return;
    setAnswers((prev) => ({ ...prev, [choiceId]: optIdx }));
  };

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = allChoices.filter(
        ({ choice }) => answers[choice.id] === choice.correct
      ).length;
      onComplete(score, total);
    }
  };

  const handleReset = () => {
    const init: Record<string, number> = {};
    if (quiz.givenAnswer !== undefined) {
      const q = quiz.questions[quiz.givenAnswer];
      for (const seg of q.segments) {
        if (isChoice(seg)) {
          init[seg.id] = seg.correct;
        }
      }
    }
    setAnswers(init);
    setChecked(false);
    onReset?.();
  };

  const allAnswered = allChoices.every(({ choice }) =>
    answers[choice.id] !== undefined
  );

  const getStatus = (choice: InlineChoiceType) => {
    if (!checked) return "neutral";
    if (answers[choice.id] === undefined) return "empty";
    return answers[choice.id] === choice.correct ? "correct" : "incorrect";
  };

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

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, qIdx) => {
          const given = isGivenQuestion(qIdx);

          return (
            <div
              key={qIdx}
              className={`flex items-baseline gap-3 p-4 rounded-2xl border-2 transition-all ${
                given
                  ? "bg-duo-surface border-gray-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <span className="text-sm font-black text-duo-gray-dark flex-shrink-0">
                {q.label}
              </span>
              <p className="text-base leading-relaxed flex flex-wrap items-baseline gap-y-2">
                {q.segments.map((seg, sIdx) =>
                  isChoice(seg) ? (
                    <ChoiceGroup
                      key={seg.id}
                      choice={seg}
                      selected={answers[seg.id]}
                      status={getStatus(seg)}
                      checked={checked}
                      disabled={given}
                      onSelect={(optIdx) => handleSelect(seg.id, optIdx, qIdx)}
                    />
                  ) : (
                    <span key={sIdx}>{seg}</span>
                  )
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCheck}
          disabled={!allAnswered || checked}
          className={`btn-3d flex-1 py-3 rounded-2xl font-extrabold text-base uppercase tracking-wide border-b-4 transition-all ${
            allAnswered && !checked
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
              allChoices.filter(
                ({ choice }) => answers[choice.id] === choice.correct
              ).length
            }{" "}
            / {total} richtig!
          </p>
        </div>
      )}
    </div>
  );
}

function ChoiceGroup({
  choice,
  selected,
  status,
  checked,
  disabled,
  onSelect,
}: {
  choice: InlineChoiceType;
  selected?: number;
  status: string;
  checked: boolean;
  disabled: boolean;
  onSelect: (optIdx: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 mx-1">
      {choice.options.map((opt, oIdx) => {
        const isSelected = selected === oIdx;
        const isCorrect = choice.correct === oIdx;

        let ringColor = "";
        if (checked && isSelected) {
          ringColor =
            status === "correct"
              ? "ring-duo-green bg-duo-green-light"
              : "ring-duo-red bg-duo-red/10";
        } else if (checked && !isSelected && isCorrect) {
          ringColor = "ring-duo-green bg-duo-green-light";
        }

        return (
          <label
            key={oIdx}
            className={`
              inline-flex items-center gap-1 cursor-pointer select-none
              ${disabled ? "cursor-default opacity-80" : ""}
            `}
          >
            <span
              onClick={(e) => {
                e.preventDefault();
                onSelect(oIdx);
              }}
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                ${
                  checked
                    ? isSelected
                      ? status === "correct"
                        ? "border-duo-green"
                        : "border-duo-red"
                      : isCorrect
                      ? "border-duo-green"
                      : "border-gray-300"
                    : isSelected
                    ? "border-duo-blue"
                    : "border-gray-300 hover:border-duo-blue"
                }
              `}
            >
              {isSelected && (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    checked
                      ? status === "correct"
                        ? "bg-duo-green"
                        : "bg-duo-red"
                      : "bg-duo-blue"
                  }`}
                />
              )}
              {checked && !isSelected && isCorrect && (
                <span className="w-2.5 h-2.5 rounded-full bg-duo-green" />
              )}
            </span>
            <span
              className={`text-base font-bold ${
                checked && isCorrect
                  ? "text-duo-green-dark font-extrabold"
                  : checked && isSelected && !isCorrect
                  ? "text-duo-red-dark line-through"
                  : "text-duo-text"
              } ${ringColor ? `px-1.5 rounded-lg ring-2 ${ringColor}` : ""}`}
            >
              {opt}
            </span>
          </label>
        );
      })}
    </span>
  );
}
