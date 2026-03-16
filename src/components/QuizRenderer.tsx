import type { Quiz } from "../types/quiz";
import WordBankFill from "./WordBankFill";
import Reorder from "./Reorder";
import Matching from "./Matching";
import FillInBlank from "./FillInBlank";
import ImageWordBank from "./ImageWordBank";
import Categorize from "./Categorize";
import InlineChoice from "./InlineChoice";
import WriteSentences from "./WriteSentences";
import TableFill from "./TableFill";

interface Props {
  quiz: Quiz;
  onComplete?: (score: number, total: number) => void;
  onReset?: () => void;
  stateKey?: string;
}

/**
 * Generic quiz dispatcher — renders the right component based on quiz.type.
 * Extend the switch as new quiz types are added.
 */
export default function QuizRenderer({ quiz, onComplete, onReset, stateKey }: Props) {
  switch (quiz.type) {
    case "word-bank-fill":
      return <WordBankFill quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "reorder":
      return <Reorder quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "matching":
      return <Matching quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "fill-in-blank":
      return <FillInBlank quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "image-word-bank":
      return <ImageWordBank quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "categorize":
      return <Categorize quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "inline-choice":
      return <InlineChoice quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "write-sentences":
      return <WriteSentences quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    case "table-fill":
      return <TableFill quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
    default:
      return (
        <div className="p-4 text-red-600">
          Unknown quiz type: <strong>{(quiz as any).type}</strong>
        </div>
      );
  }
}
