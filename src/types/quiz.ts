/** A single blank in a sentence that the user must fill */
export interface Blank {
  /** Unique id for this blank within the quiz */
  id: string;
  /** The correct word that belongs here */
  answer: string;
}

/** A dialogue line with text segments and blanks interleaved */
export interface DialogueLine {
  /** Speaker marker — use "square" for the dark square, "triangle" for the triangle */
  speaker: "square" | "triangle";
  /**
   * Segments of the line in order.
   * A string is rendered as-is. A Blank is rendered as a droppable slot.
   */
  segments: (string | Blank)[];
}

/** "Ordnen Sie zu" — fill blanks from a shared word bank */
export interface WordBankFillQuiz {
  type: "word-bank-fill";
  /** Exercise number shown in the header (e.g. "1") */
  exerciseNumber: number;
  /** Kursbuch reference (e.g. "KB 2") */
  reference?: string;
  /** Section label (e.g. "STRUKTUREN") */
  section?: string;
  /** Instruction text (e.g. "Ordnen Sie zu.") */
  instruction: string;
  /** Pool of words the user picks from */
  wordBank: string[];
  /** Groups of dialogue lines (each group is one conversation) */
  dialogues: DialogueLine[][];
}

/** "Sortieren Sie" — reorder scrambled sentences into the correct sequence */
export interface ReorderQuiz {
  type: "reorder";
  exerciseNumber: number;
  reference?: string;
  section?: string;
  instruction: string;
  /** Sentences displayed in scrambled order */
  sentences: string[];
  /** Correct order as indices into the sentences array (0-based) */
  correctOrder: number[];
  /** Optional: index of a sentence pre-placed as a hint (shown as "1") */
  givenFirst?: number;
  /** Optional image shown beside the exercise */
  image?: string;
}

/** "Ordnen Sie zu" (matching) — connect left items to right items */
export interface MatchingQuiz {
  type: "matching";
  exerciseNumber: number;
  reference?: string;
  section?: string;
  instruction: string;
  /** Left-side items with labels (a, b, c...) */
  left: { label: string; text: string }[];
  /** Right-side items (displayed in a fixed order) */
  right: string[];
  /** Correct pairs: index into left -> index into right */
  correctPairs: Record<number, number>;
  /** Optional: a pre-connected pair shown as hint (leftIndex) */
  givenPair?: { left: number; right: number };
}

/** "Ergänzen Sie" — free-form fill-in-the-blank (user types answers) */
export interface FillInBlankQuiz {
  type: "fill-in-blank";
  exerciseNumber: number;
  reference?: string;
  section?: string;
  instruction: string;
  /** Labelled dialogue groups (e.g. "a", "b") */
  dialogues: { label?: string; lines: DialogueLine[] }[];
}

/** "Welches Land passt?" — assign words from a bank to labelled image cards */
export interface ImageWordBankQuiz {
  type: "image-word-bank";
  exerciseNumber: number;
  reference?: string;
  section?: string;
  instruction: string;
  title?: string;
  wordBank: string[];
  cards: {
    label: string;
    caption: string;
    image?: string;
    answer: string;
  }[];
  /** Index of a pre-filled card shown as hint */
  givenCard?: number;
}

/** Union of all quiz types — extend this as we add more */
export type Quiz =
  | WordBankFillQuiz
  | ReorderQuiz
  | MatchingQuiz
  | FillInBlankQuiz
  | ImageWordBankQuiz;

/** A lesson containing multiple quizzes */
export interface Lektion {
  lektion: number;
  title: string;
  quizzes: Quiz[];
}
