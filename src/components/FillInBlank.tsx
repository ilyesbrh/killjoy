import type { FillInBlankQuiz, Blank, DialogueLine } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: FillInBlankQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

function isBlank(segment: string | Blank): segment is Blank {
  return typeof segment !== "string";
}

export default function FillInBlank({ quiz, onComplete, onReset, stateKey }: Props) {
  const allBlanks: Blank[] = quiz.dialogues
    .flatMap((d) => d.lines)
    .flatMap((line) => line.segments.filter(isBlank));

  const [answers, setAnswers] = useQuizState<Record<string, string>>(stateKey ? `${stateKey}-a` : undefined, {});
  const [checked, setChecked] = useQuizState(stateKey ? `${stateKey}-c` : undefined, false);

  const handleChange = (id: string, value: string) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheck = () => {
    setChecked(true);
    if (onComplete) {
      const score = allBlanks.filter(
        (b) => answers[b.id]?.trim().toLowerCase() === b.answer.toLowerCase()
      ).length;
      onComplete(score, allBlanks.length);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setChecked(false);
    onReset?.();
  };

  const getStatus = (blank: Blank) => {
    if (!checked) return "neutral";
    const val = answers[blank.id]?.trim().toLowerCase();
    if (!val) return "empty";
    return val === blank.answer.toLowerCase() ? "correct" : "incorrect";
  };

  const allFilled = allBlanks.every((b) => answers[b.id]?.trim());

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

      {/* Dialogues */}
      <div className="space-y-6">
        {quiz.dialogues.map((dialogue, dIdx) => (
          <div
            key={dIdx}
            className="p-4 bg-white rounded-2xl border-2 border-gray-200"
          >
            {dialogue.label && (
              <span className="text-sm font-extrabold text-duo-gray-dark mb-2 block">
                {dialogue.label}
              </span>
            )}
            <div className="space-y-3">
              {dialogue.lines.map((line, lIdx) => (
                <LineView
                  key={lIdx}
                  line={line}
                  answers={answers}
                  checked={checked}
                  getStatus={getStatus}
                  onChange={handleChange}
                />
              ))}
            </div>
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

      {/* Score */}
      {checked && (
        <div className="mt-4 p-4 rounded-2xl bg-duo-green-light border-2 border-duo-green">
          <p className="text-base font-extrabold text-duo-green-dark">
            {
              allBlanks.filter(
                (b) =>
                  answers[b.id]?.trim().toLowerCase() ===
                  b.answer.toLowerCase()
              ).length
            }{" "}
            / {allBlanks.length} richtig!
          </p>
        </div>
      )}
    </div>
  );
}

function LineView({
  line,
  answers,
  checked,
  getStatus,
  onChange,
}: {
  line: DialogueLine;
  answers: Record<string, string>;
  checked: boolean;
  getStatus: (blank: Blank) => string;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-2 flex-shrink-0">
        {line.speaker === "square" ? (
          <span className="inline-block w-3 h-3 bg-duo-text rounded-sm" />
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

      <p className="text-lg leading-relaxed flex flex-wrap items-baseline gap-y-1">
        {line.segments.map((seg, sIdx) =>
          isBlank(seg) ? (
            <BlankInput
              key={seg.id}
              blank={seg}
              value={answers[seg.id] || ""}
              status={getStatus(seg)}
              checked={checked}
              onChange={onChange}
            />
          ) : (
            <span key={sIdx}>{seg}</span>
          )
        )}
      </p>
    </div>
  );
}

function BlankInput({
  blank,
  value,
  status,
  checked,
  onChange,
}: {
  blank: Blank;
  value: string;
  status: string;
  checked: boolean;
  onChange: (id: string, value: string) => void;
}) {
  const width = Math.max(blank.answer.length * 11, 60);

  const borderColor = checked
    ? status === "correct"
      ? "border-duo-green"
      : status === "incorrect"
      ? "border-duo-red"
      : "border-gray-300"
    : "border-gray-300 focus-within:border-duo-blue";

  const bgColor = checked
    ? status === "correct"
      ? "bg-duo-green-light"
      : status === "incorrect"
      ? "bg-duo-red/10"
      : "bg-duo-surface"
    : "bg-white";

  return (
    <span className="inline-flex flex-col mx-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(blank.id, e.target.value)}
        disabled={checked}
        style={{ width: `${width}px` }}
        className={`
          px-1 py-0.5 text-base font-bold border-b-2 outline-none transition-all
          ${borderColor} ${bgColor}
          ${checked ? "" : "hover:border-duo-blue"}
        `}
      />
      {checked && status === "incorrect" && (
        <span className="text-xs text-duo-green-dark font-bold mt-0.5">{blank.answer}</span>
      )}
    </span>
  );
}
