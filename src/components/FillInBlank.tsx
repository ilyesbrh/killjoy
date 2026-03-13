import { useState } from "react";
import type { FillInBlankQuiz, Blank, DialogueLine } from "../types/quiz";

interface Props {
  quiz: FillInBlankQuiz;
  onComplete?: (score: number, total: number) => void;
}

function isBlank(segment: string | Blank): segment is Blank {
  return typeof segment !== "string";
}

export default function FillInBlank({ quiz, onComplete }: Props) {
  const allBlanks: Blank[] = quiz.dialogues
    .flatMap((d) => d.lines)
    .flatMap((line) => line.segments.filter(isBlank));

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

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
  };

  const getStatus = (blank: Blank) => {
    if (!checked) return "neutral";
    const val = answers[blank.id]?.trim().toLowerCase();
    if (!val) return "empty";
    return val === blank.answer.toLowerCase() ? "correct" : "incorrect";
  };

  const allFilled = allBlanks.every((b) => answers[b.id]?.trim());

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

      {/* Dialogues */}
      <div className="space-y-6">
        {quiz.dialogues.map((dialogue, dIdx) => (
          <div
            key={dIdx}
            className="p-4 bg-white rounded-lg border border-gray-100"
          >
            {dialogue.label && (
              <span className="text-sm font-bold text-gray-500 mb-2 block">
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
      ? "border-green-500"
      : status === "incorrect"
      ? "border-red-500"
      : "border-gray-300"
    : "border-gray-400 focus-within:border-blue-500";

  const bgColor = checked
    ? status === "correct"
      ? "bg-green-50"
      : status === "incorrect"
      ? "bg-red-50"
      : "bg-gray-50"
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
          px-1 py-0.5 text-base font-medium border-b-2 outline-none transition-all
          ${borderColor} ${bgColor}
          ${checked ? "" : "hover:border-blue-400"}
        `}
      />
      {checked && status === "incorrect" && (
        <span className="text-xs text-green-600 mt-0.5">{blank.answer}</span>
      )}
    </span>
  );
}
