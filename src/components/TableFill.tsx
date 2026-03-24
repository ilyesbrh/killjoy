import type { TableFillQuiz, Blank } from "../types/quiz";
import { useQuizState } from "../useQuizState";

interface Props {
  quiz: TableFillQuiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

function isBlank(cell: string | Blank): cell is Blank {
  return typeof cell !== "string";
}

export default function TableFill({ quiz, onComplete, onReset, stateKey }: Props) {
  const allBlanks: Blank[] = quiz.rows.flatMap((r) => r.cells.filter(isBlank));

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

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-extrabold text-duo-gray-dark border-b-2 border-gray-200" />
              {quiz.columns.map((col, i) => (
                <th
                  key={i}
                  className="p-3 text-center text-base font-extrabold text-duo-text border-b-2 border-gray-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quiz.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 0 ? "bg-duo-surface" : "bg-white"}
              >
                <td className="p-3 text-base font-extrabold text-duo-text whitespace-nowrap">
                  {row.label}
                </td>
                {row.cells.map((cell, cIdx) =>
                  isBlank(cell) ? (
                    <td key={cIdx} className="p-2 text-center">
                      <CellInput
                        blank={cell}
                        value={answers[cell.id] || ""}
                        status={getStatus(cell)}
                        checked={checked}
                        onChange={handleChange}
                      />
                    </td>
                  ) : (
                    <td
                      key={cIdx}
                      className="p-3 text-center text-base font-bold text-duo-gray-dark"
                    >
                      {cell}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
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

function CellInput({
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
  const borderColor = checked
    ? status === "correct"
      ? "border-duo-green"
      : status === "incorrect"
      ? "border-duo-red"
      : "border-gray-300"
    : "border-gray-300 focus-within:border-duo-blue hover:border-duo-blue";

  const bgColor = checked
    ? status === "correct"
      ? "bg-duo-green-light"
      : status === "incorrect"
      ? "bg-duo-red/10"
      : "bg-white"
    : "bg-white";

  return (
    <div className="inline-flex flex-col items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(blank.id, e.target.value)}
        disabled={checked}
        className={`w-24 px-2 py-1 text-center text-base font-bold border-b-2 outline-none transition-all rounded-lg ${borderColor} ${bgColor}`}
      />
      {checked && status === "incorrect" && (
        <span className="text-xs text-duo-green-dark font-bold mt-0.5">{blank.answer}</span>
      )}
    </div>
  );
}
