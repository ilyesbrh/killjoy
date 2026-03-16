import { useState, useMemo } from "react";
import QuizRenderer from "./components/QuizRenderer";
import type { Quiz, Blank, DialogueLine } from "./types/quiz";

// ─── Types ────────────────────────────────────────────────────────────

type QuizTypeName = Quiz["type"];

interface CommonFields {
  exerciseNumber: number;
  reference: string;
  section: string;
  instruction: string;
  title: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const QUIZ_TYPES: { value: QuizTypeName; label: string }[] = [
  { value: "word-bank-fill", label: "Word Bank Fill (Ordnen Sie zu)" },
  { value: "reorder", label: "Reorder (Sortieren Sie)" },
  { value: "matching", label: "Matching (Zuordnen)" },
  { value: "fill-in-blank", label: "Fill in Blank (Ergänzen Sie)" },
  { value: "image-word-bank", label: "Image Word Bank" },
  { value: "categorize", label: "Categorize (Sortieren)" },
  { value: "inline-choice", label: "Inline Choice (Kreuzen Sie an)" },
  { value: "write-sentences", label: "Write Sentences (Schreiben Sie)" },
  { value: "table-fill", label: "Table Fill (Tabelle)" },
];

const SECTION_OPTIONS = [
  "",
  "STRUKTUREN",
  "KOMMUNIKATION",
  "WÖRTER",
  "BASISTRAINING",
  "TEST",
  "TRAINING: HÖREN",
  "TRAINING: LESEN",
  "TRAINING: SCHREIBEN",
];

const DEFAULT_COMMON: CommonFields = {
  exerciseNumber: 1,
  reference: "KB 2",
  section: "STRUKTUREN",
  instruction: "Ordnen Sie zu.",
  title: "",
};

const DEFAULT_FIELDS: Record<QuizTypeName, Record<string, string>> = {
  "word-bank-fill": {
    wordBank: "heiße, du, Hallo, heißt, ich, wer, wie",
    dialogueMarkup:
      "▪ Hallo! Ich bin Wiebke. Und __wer__ bist __du__?\n▲ __Hallo__, __ich__ bin Stefan.\n---\n▪ Ich heiße René. Und __wie__ __heißt__ du?\n▲ Ich __heiße__ Alfred.",
  },
  reorder: {
    sentences:
      "Hallo! Ich heiße Roberto, und wer bist du?\nIch heiße Melanie.\nUnd woher kommst du? Aus Deutschland?\nJa, ich komme aus Deutschland.\nNein, ich komme aus Brasilien.\nAus Brasilien? Wow!",
    givenFirst: "1",
  },
  matching: {
    pairs:
      "a: Wie | heißt du?\nb: Ich heiße | Sandra.\nc: Woher | kommst du?\nd: Ich komme | aus der Schweiz.",
    givenPair: "",
  },
  "fill-in-blank": {
    dialogueMarkup:
      "[a]\n▪ Hallo! Ich bin Simon. __Wie__ heißt du?\n▲ Ich __heiße__ Lisa.\n[b]\n▪ Woher __kommst__ du?\n▲ Ich komme __aus__ Berlin.",
  },
  "image-word-bank": {
    wordBank: "Deutschland, Frankreich, Österreich",
    cards:
      "A | Brandenburger Tor | | Deutschland\nB | Eiffelturm | | Frankreich\nC | Schloss Schönbrunn | | Österreich",
    givenCard: "",
  },
  categorize: {
    categories: "du, Sie",
    items:
      "1 | Freunde im Café | | 0\n2 | Im Büro mit Chef | | 1\n3 | Mit Familie | | 0",
    givenItems: "",
  },
  "inline-choice": {
    questions:
      "a: Woher kommen {du|*Sie}, Herr Svendson?\nb: Wie {*heißt|heißen} du?\nc: Wer {bist|*ist|sind} das?",
    givenAnswer: "",
  },
  "write-sentences": {
    cards:
      "A | Philipp Lahm | Deutschland | | Das ist Philipp Lahm. / Er kommt aus Deutschland.\nB | Zinédine Zidane | Frankreich | | Das ist Zinédine Zidane. / Er kommt aus Frankreich.",
    givenCard: "0",
  },
  "table-fill": {
    columns: "heißen, kommen, sein",
    rows: "ich | heiße, __komme__, bin\ndu | __heißt__, __kommst__, __bist__\ner/sie | __heißt__, __kommt__, __ist__",
  },
};

// ─── Parsers ──────────────────────────────────────────────────────────

function parseDialogueMarkup(markup: string, prefix: string) {
  const groups = markup
    .split(/\n---\n|\n---/)
    .map((g) => g.trim())
    .filter(Boolean);
  let counter = 0;

  const dialogues: DialogueLine[][] = groups.map((group) => {
    return group
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        let speaker: "square" | "triangle" = "square";
        let text = line;
        if (line.startsWith("▲")) {
          speaker = "triangle";
          text = line.replace(/^▲\s*/, "");
        } else {
          text = line.replace(/^▪\s*/, "");
        }
        const segments: (string | Blank)[] = [];
        for (const part of text.split(/(__[^_]+__)/g)) {
          const m = part.match(/^__(.+)__$/);
          if (m) {
            counter++;
            segments.push({ id: `${prefix}${String.fromCharCode(96 + counter)}`, answer: m[1] });
          } else if (part) {
            segments.push(part);
          }
        }
        return { speaker, segments } as DialogueLine;
      });
  });

  return dialogues;
}

function parseLabelledDialogueMarkup(markup: string, prefix: string) {
  const result: { label?: string; lines: DialogueLine[] }[] = [];
  let currentLabel = "";
  let currentLines: string[] = [];
  let counter = 0;

  const flush = () => {
    if (!currentLines.length) return;
    const lines = currentLines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        let speaker: "square" | "triangle" = "square";
        let text = line;
        if (line.startsWith("▲")) {
          speaker = "triangle";
          text = line.replace(/^▲\s*/, "");
        } else {
          text = line.replace(/^▪\s*/, "");
        }
        const segments: (string | Blank)[] = [];
        for (const part of text.split(/(__[^_]+__)/g)) {
          const m = part.match(/^__(.+)__$/);
          if (m) {
            counter++;
            segments.push({
              id: `${prefix}${currentLabel || ""}${counter}`,
              answer: m[1],
            });
          } else if (part) {
            segments.push(part);
          }
        }
        return { speaker, segments } as DialogueLine;
      });
    result.push({ label: currentLabel || undefined, lines });
    currentLines = [];
  };

  for (const line of markup.split("\n")) {
    const labelMatch = line.trim().match(/^\[([^\]]*)\]$/);
    if (labelMatch) {
      flush();
      currentLabel = labelMatch[1];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return result;
}

function parseInlineChoiceSegments(text: string, prefix: string, startIdx: number) {
  const segments: (string | { id: string; options: string[]; correct: number })[] = [];
  let idx = startIdx;
  for (const part of text.split(/(\{[^}]+\})/g)) {
    const m = part.match(/^\{(.+)\}$/);
    if (m) {
      const raw = m[1].split("|");
      let correct = 0;
      const options = raw.map((o, i) => {
        if (o.startsWith("*")) {
          correct = i;
          return o.slice(1);
        }
        return o;
      });
      idx++;
      segments.push({ id: `${prefix}${String.fromCharCode(96 + idx)}`, options, correct });
    } else if (part) {
      segments.push(part);
    }
  }
  return { segments, nextIdx: idx };
}

function scrambleIndices(n: number): number[] {
  const evens: number[] = [];
  const odds: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) evens.push(i);
    else odds.push(i);
  }
  return [...evens, ...odds.reverse()];
}

// ─── Quiz Builder ─────────────────────────────────────────────────────

function buildQuiz(
  type: QuizTypeName,
  common: CommonFields,
  fields: Record<string, string>
): Quiz | null {
  const base: Record<string, unknown> = {
    type,
    exerciseNumber: common.exerciseNumber,
    instruction: common.instruction,
  };
  if (common.reference) base.reference = common.reference;
  if (common.section) base.section = common.section;
  if (common.title) base.title = common.title;

  const pfx = String(common.exerciseNumber);

  try {
    switch (type) {
      case "word-bank-fill": {
        const wordBank = fields.wordBank
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean);
        const dialogues = parseDialogueMarkup(fields.dialogueMarkup || "", pfx);
        if (!wordBank.length || !dialogues.length) return null;
        return { ...base, type: "word-bank-fill", wordBank, dialogues } as Quiz;
      }

      case "reorder": {
        const adminLines = (fields.sentences || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (adminLines.length < 2) return null;
        const n = adminLines.length;
        const shuffle = scrambleIndices(n);
        const sentences = shuffle.map((i) => adminLines[i]);
        const correctOrder = Array(n).fill(0);
        shuffle.forEach((readingPos, displayIdx) => {
          correctOrder[readingPos] = displayIdx;
        });
        const result: Record<string, unknown> = {
          ...base,
          type: "reorder",
          sentences,
          correctOrder,
        };
        const gf = parseInt(fields.givenFirst || "");
        if (!isNaN(gf) && gf >= 1 && gf <= n) {
          result.givenFirst = correctOrder[gf - 1];
        }
        return result as unknown as Quiz;
      }

      case "matching": {
        const pairLines = (fields.pairs || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!pairLines.length) return null;

        const parsed = pairLines.map((line) => {
          const [leftPart, rightText] = line.split(" | ");
          const colonIdx = leftPart.indexOf(":");
          const label = leftPart.slice(0, colonIdx).trim();
          const text = leftPart.slice(colonIdx + 1).trim();
          return { label, text, right: (rightText || "").trim() };
        });

        const left = parsed.map((p) => ({ label: p.label, text: p.text }));
        const rightTexts = parsed.map((p) => p.right);
        const sortedRight = [...rightTexts].sort((a, b) => a.localeCompare(b));

        const correctPairs: Record<number, number> = {};
        parsed.forEach((p, leftIdx) => {
          correctPairs[leftIdx] = sortedRight.indexOf(p.right);
        });

        const result: Record<string, unknown> = {
          ...base,
          type: "matching",
          left,
          right: sortedRight,
          correctPairs,
        };

        const gp = parseInt(fields.givenPair || "");
        if (!isNaN(gp) && gp >= 0 && gp < parsed.length) {
          result.givenPair = { left: gp, right: correctPairs[gp] };
        }
        return result as unknown as Quiz;
      }

      case "fill-in-blank": {
        const dialogues = parseLabelledDialogueMarkup(fields.dialogueMarkup || "", pfx);
        if (!dialogues.length) return null;
        return { ...base, type: "fill-in-blank", dialogues } as Quiz;
      }

      case "image-word-bank": {
        const wordBank = fields.wordBank
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean);
        const cardLines = (fields.cards || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!wordBank.length || !cardLines.length) return null;

        const cards = cardLines.map((line) => {
          const [label, caption, image, answer] = line.split(" | ").map((s) => s.trim());
          return {
            label: label || "",
            caption: caption || "",
            ...(image ? { image } : {}),
            answer: answer || "",
          };
        });

        const result: Record<string, unknown> = {
          ...base,
          type: "image-word-bank",
          wordBank,
          cards,
        };
        const gc = parseInt(fields.givenCard || "");
        if (!isNaN(gc) && gc >= 0 && gc < cards.length) result.givenCard = gc;
        return result as unknown as Quiz;
      }

      case "categorize": {
        const categories = fields.categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        const itemLines = (fields.items || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!categories.length || !itemLines.length) return null;

        const items = itemLines.map((line) => {
          const parts = line.split(" | ").map((s) => s.trim());
          return {
            label: parts[0] || "",
            ...(parts[1] ? { description: parts[1] } : {}),
            ...(parts[2] ? { image: parts[2] } : {}),
            correctCategory: parseInt(parts[3] || "0") || 0,
          };
        });

        const result: Record<string, unknown> = {
          ...base,
          type: "categorize",
          categories,
          items,
        };

        if (fields.givenItems?.trim()) {
          const givenItems = fields.givenItems.split(",").map((pair) => {
            const [a, b] = pair.split(":").map((s) => parseInt(s.trim()));
            return [a, b] as [number, number];
          });
          result.givenItems = givenItems;
        }
        return result as unknown as Quiz;
      }

      case "inline-choice": {
        const qLines = (fields.questions || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!qLines.length) return null;

        let choiceIdx = 0;
        const questions = qLines.map((line) => {
          const colonIdx = line.indexOf(":");
          const label = line.slice(0, colonIdx).trim();
          const text = line.slice(colonIdx + 1).trim();
          const { segments, nextIdx } = parseInlineChoiceSegments(text, pfx, choiceIdx);
          choiceIdx = nextIdx;
          return { label, segments };
        });

        const result: Record<string, unknown> = {
          ...base,
          type: "inline-choice",
          questions,
        };
        const ga = parseInt(fields.givenAnswer || "");
        if (!isNaN(ga) && ga >= 0 && ga < questions.length) result.givenAnswer = ga;
        return result as unknown as Quiz;
      }

      case "write-sentences": {
        const cardLines = (fields.cards || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!cardLines.length) return null;

        const cards = cardLines.map((line) => {
          const parts = line.split(" | ").map((s) => s.trim());
          return {
            label: parts[0] || "",
            name: parts[1] || "",
            country: parts[2] || "",
            ...(parts[3] ? { image: parts[3] } : {}),
            expectedSentences: (parts[4] || "")
              .split(" / ")
              .map((s) => s.trim())
              .filter(Boolean),
          };
        });

        const result: Record<string, unknown> = {
          ...base,
          type: "write-sentences",
          cards,
        };
        const gc = parseInt(fields.givenCard || "");
        if (!isNaN(gc) && gc >= 0 && gc < cards.length) result.givenCard = gc;
        return result as unknown as Quiz;
      }

      case "table-fill": {
        const columns = fields.columns
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        const rowLines = (fields.rows || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (!columns.length || !rowLines.length) return null;

        let cellCounter = 0;
        const rows = rowLines.map((line) => {
          const [label, cellsStr] = line.split(" | ").map((s) => s.trim());
          const cells: (string | Blank)[] = (cellsStr || "")
            .split(",")
            .map((c) => c.trim())
            .map((cell) => {
              const m = cell.match(/^__(.+)__$/);
              if (m) {
                cellCounter++;
                return {
                  id: `${pfx}${String.fromCharCode(96 + cellCounter)}`,
                  answer: m[1],
                } as Blank;
              }
              return cell;
            });
          return { label: label || "", cells };
        });

        return { ...base, type: "table-fill", columns, rows } as Quiz;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ─── Reusable Form Components ─────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";
const helpCls = "text-xs text-slate-400 mt-1";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      {help && <p className={helpCls}>{help}</p>}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 6,
  placeholder,
  help,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  help?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputCls} resize-y ${mono ? "font-mono text-xs" : ""}`}
      />
      {help && <p className={helpCls}>{help}</p>}
    </div>
  );
}

// ─── Type-Specific Forms ──────────────────────────────────────────────

function TypeForm({
  type,
  fields,
  onChange,
}: {
  type: QuizTypeName;
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const f = (key: string) => fields[key] || "";
  const set = (key: string) => (v: string) => onChange(key, v);

  switch (type) {
    case "word-bank-fill":
      return (
        <div className="space-y-4">
          <Field
            label="Word Bank"
            value={f("wordBank")}
            onChange={set("wordBank")}
            placeholder="heiße, du, Hallo, heißt"
            help="Comma-separated words"
          />
          <TextArea
            label="Dialogues"
            value={f("dialogueMarkup")}
            onChange={set("dialogueMarkup")}
            rows={8}
            mono
            help="▪ = square speaker, ▲ = triangle speaker, __word__ = blank, --- = new dialogue group"
          />
        </div>
      );

    case "reorder":
      return (
        <div className="space-y-4">
          <TextArea
            label="Sentences (correct reading order)"
            value={f("sentences")}
            onChange={set("sentences")}
            rows={8}
            help="One sentence per line, in the CORRECT reading order. They will be scrambled automatically."
          />
          <Field
            label="Given First (optional)"
            value={f("givenFirst")}
            onChange={set("givenFirst")}
            type="number"
            placeholder="1"
            help="Which sentence (1-based) to reveal as a hint"
          />
        </div>
      );

    case "matching":
      return (
        <div className="space-y-4">
          <TextArea
            label="Pairs"
            value={f("pairs")}
            onChange={set("pairs")}
            rows={6}
            mono
            help="One pair per line: label: left text | right text. Right items are auto-shuffled."
          />
          <Field
            label="Given Pair (optional)"
            value={f("givenPair")}
            onChange={set("givenPair")}
            type="number"
            placeholder="0"
            help="0-based index of the pair to reveal as a hint"
          />
        </div>
      );

    case "fill-in-blank":
      return (
        <div className="space-y-4">
          <TextArea
            label="Dialogues"
            value={f("dialogueMarkup")}
            onChange={set("dialogueMarkup")}
            rows={10}
            mono
            help="[label] for groups, ▪/▲ for speakers, __word__ for blanks"
          />
        </div>
      );

    case "image-word-bank":
      return (
        <div className="space-y-4">
          <Field
            label="Word Bank"
            value={f("wordBank")}
            onChange={set("wordBank")}
            placeholder="Deutschland, Frankreich, Österreich"
            help="Comma-separated words"
          />
          <TextArea
            label="Cards"
            value={f("cards")}
            onChange={set("cards")}
            rows={5}
            mono
            help="One per line: label | caption | image_url | answer"
          />
          <Field
            label="Given Card (optional)"
            value={f("givenCard")}
            onChange={set("givenCard")}
            type="number"
            placeholder="0"
            help="0-based card index to pre-fill as a hint"
          />
        </div>
      );

    case "categorize":
      return (
        <div className="space-y-4">
          <Field
            label="Categories"
            value={f("categories")}
            onChange={set("categories")}
            placeholder="du, Sie"
            help="Comma-separated category names"
          />
          <TextArea
            label="Items"
            value={f("items")}
            onChange={set("items")}
            rows={6}
            mono
            help="One per line: label | description | image_url | category_index (0-based)"
          />
          <Field
            label="Given Items (optional)"
            value={f("givenItems")}
            onChange={set("givenItems")}
            placeholder="0:0, 2:1"
            help="Pre-assigned pairs: itemIdx:categoryIdx, separated by commas"
          />
        </div>
      );

    case "inline-choice":
      return (
        <div className="space-y-4">
          <TextArea
            label="Questions"
            value={f("questions")}
            onChange={set("questions")}
            rows={6}
            mono
            help="One per line: label: text with {opt1|opt2|*correct} inline choices. * marks correct."
          />
          <Field
            label="Given Answer (optional)"
            value={f("givenAnswer")}
            onChange={set("givenAnswer")}
            type="number"
            placeholder="0"
            help="0-based question index to pre-answer as a hint"
          />
        </div>
      );

    case "write-sentences":
      return (
        <div className="space-y-4">
          <TextArea
            label="Cards"
            value={f("cards")}
            onChange={set("cards")}
            rows={5}
            mono
            help="One per line: label | name | country | image_url | sentence1 / sentence2"
          />
          <Field
            label="Given Card (optional)"
            value={f("givenCard")}
            onChange={set("givenCard")}
            type="number"
            placeholder="0"
            help="0-based card index to show as an example"
          />
        </div>
      );

    case "table-fill":
      return (
        <div className="space-y-4">
          <Field
            label="Columns"
            value={f("columns")}
            onChange={set("columns")}
            placeholder="heißen, kommen, sein"
            help="Comma-separated column headers (verbs)"
          />
          <TextArea
            label="Rows"
            value={f("rows")}
            onChange={set("rows")}
            rows={6}
            mono
            help="One per line: label | cell1, cell2, cell3. Use __answer__ for blanks, plain text for pre-filled."
          />
        </div>
      );
  }
}

// ─── Main Component ───────────────────────────────────────────────────

export default function AdminPanel() {
  const [quizType, setQuizType] = useState<QuizTypeName>("word-bank-fill");
  const [common, setCommon] = useState<CommonFields>({ ...DEFAULT_COMMON });
  const [fields, setFields] = useState<Record<string, string>>({
    ...DEFAULT_FIELDS["word-bank-fill"],
  });
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview" | "json">("form");

  const handleTypeChange = (t: QuizTypeName) => {
    setQuizType(t);
    setFields({ ...DEFAULT_FIELDS[t] });
  };

  const updateField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const quiz = useMemo(() => {
    try {
      return buildQuiz(quizType, common, fields);
    } catch {
      return null;
    }
  }, [quizType, common, fields]);

  const jsonOutput = useMemo(
    () => (quiz ? JSON.stringify(quiz, null, 2) : ""),
    [quiz]
  );

  const handleCopy = async () => {
    if (!jsonOutput) return;
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-sm">K</span>
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 text-sm">KillJoy</span>
              <span className="text-xs text-amber-600 font-medium ml-1.5 bg-amber-50 px-1.5 py-0.5 rounded">
                Quiz Generator
              </span>
            </div>
          </div>
          <a
            href="#/"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Zurück
          </a>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        {(["form", "preview", "json"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize cursor-pointer transition-colors
              ${mobileTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab === "form" ? "Editor" : tab === "preview" ? "Vorschau" : "JSON"}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* ── Left: Form ── */}
          <div
            className={`space-y-6 ${mobileTab !== "form" ? "hidden lg:block" : ""}`}
          >
            {/* Quiz type */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className={labelCls}>Quiz-Typ</label>
              <select
                value={quizType}
                onChange={(e) => handleTypeChange(e.target.value as QuizTypeName)}
                className={`${inputCls} cursor-pointer`}
              >
                {QUIZ_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Common fields */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-700">Allgemein</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Übungsnummer"
                  value={String(common.exerciseNumber)}
                  onChange={(v) =>
                    setCommon((p) => ({
                      ...p,
                      exerciseNumber: parseInt(v) || 1,
                    }))
                  }
                  type="number"
                />
                <Field
                  label="Referenz"
                  value={common.reference}
                  onChange={(v) => setCommon((p) => ({ ...p, reference: v }))}
                  placeholder="KB 2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Abschnitt</label>
                  <select
                    value={common.section}
                    onChange={(e) =>
                      setCommon((p) => ({ ...p, section: e.target.value }))
                    }
                    className={`${inputCls} cursor-pointer`}
                  >
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s || "(keiner)"}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Titel (optional)"
                  value={common.title}
                  onChange={(v) => setCommon((p) => ({ ...p, title: v }))}
                  placeholder="z.B. du oder Sie?"
                />
              </div>
              <Field
                label="Anweisung"
                value={common.instruction}
                onChange={(v) => setCommon((p) => ({ ...p, instruction: v }))}
                placeholder="Ordnen Sie zu."
              />
            </div>

            {/* Type-specific fields */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">
                {QUIZ_TYPES.find((t) => t.value === quizType)?.label}
              </h3>
              <TypeForm type={quizType} fields={fields} onChange={updateField} />
            </div>
          </div>

          {/* ── Right: Preview + JSON ── */}
          <div className="space-y-6 lg:sticky lg:top-20">
            {/* Preview */}
            <div
              className={`${mobileTab === "json" ? "hidden lg:block" : ""} ${mobileTab === "form" ? "hidden lg:block" : ""}`}
            >
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Vorschau
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[200px]">
                {quiz ? (
                  <div className="py-4">
                    <QuizRenderer quiz={quiz} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    Bitte füllen Sie das Formular aus
                  </div>
                )}
              </div>
            </div>

            {/* JSON Output */}
            <div
              className={`${mobileTab === "preview" ? "hidden lg:block" : ""} ${mobileTab === "form" ? "hidden lg:block" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  JSON Output
                </h3>
                <button
                  onClick={handleCopy}
                  disabled={!jsonOutput}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${
                      copied
                        ? "bg-green-100 text-green-700"
                        : jsonOutput
                          ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-auto max-h-[50vh] text-xs font-mono leading-relaxed select-all">
                {jsonOutput || "// Ungültige oder unvollständige Eingabe"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
