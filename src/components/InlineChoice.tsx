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

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, qIdx) => {
          const given = isGivenQuestion(qIdx);

          return (
            <div
              key={qIdx}
              className={`flex items-baseline gap-3 p-4 rounded-lg border transition-all ${
                given
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <span className="text-sm font-bold text-gray-500 flex-shrink-0">
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
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleCheck}
          disabled={!allAnswered || checked}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-base transition-all
            ${
              allAnswered && !checked
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
              ? "ring-green-500 bg-green-50"
              : "ring-red-500 bg-red-50";
        } else if (checked && !isSelected && isCorrect) {
          ringColor = "ring-green-400 bg-green-50";
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
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                ${
                  checked
                    ? isSelected
                      ? status === "correct"
                        ? "border-green-500"
                        : "border-red-500"
                      : isCorrect
                      ? "border-green-500"
                      : "border-gray-300"
                    : isSelected
                    ? "border-blue-500"
                    : "border-gray-400 hover:border-blue-400"
                }
              `}
            >
              {isSelected && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    checked
                      ? status === "correct"
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-blue-500"
                  }`}
                />
              )}
              {checked && !isSelected && isCorrect && (
                <span className="w-2 h-2 rounded-full bg-green-500" />
              )}
            </span>
            <span
              className={`text-base font-medium ${
                checked && isCorrect
                  ? "text-green-700"
                  : checked && isSelected && !isCorrect
                  ? "text-red-700 line-through"
                  : "text-gray-800"
              } ${ringColor ? `px-1 rounded ${ringColor} ring-1` : ""}`}
            >
              {opt}
            </span>
          </label>
        );
      })}
    </span>
  );
}
