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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-500 border-b-2 border-gray-200" />
              {quiz.columns.map((col, i) => (
                <th
                  key={i}
                  className="p-3 text-center text-base font-bold text-gray-800 border-b-2 border-gray-200"
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
                className={rIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-3 text-base font-semibold text-gray-700 whitespace-nowrap">
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
                      className="p-3 text-center text-base text-gray-700"
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
    <div className="inline-flex flex-col items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(blank.id, e.target.value)}
        disabled={checked}
        className={`
          w-24 px-2 py-1 text-center text-base font-medium border-b-2 outline-none transition-all rounded-sm
          ${borderColor} ${bgColor}
          ${checked ? "" : "hover:border-blue-400"}
        `}
      />
      {checked && status === "incorrect" && (
        <span className="text-xs text-green-600 mt-0.5">{blank.answer}</span>
      )}
    </div>
  );
}
