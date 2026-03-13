import type { Quiz } from "../types/quiz";
import WordBankFill from "./WordBankFill";
import Reorder from "./Reorder";
import Matching from "./Matching";

interface Props {
  quiz: Quiz;
  onComplete?: (score: number, total: number) => void;
}

/**
 * Generic quiz dispatcher — renders the right component based on quiz.type.
 * Extend the switch as new quiz types are added.
 */
export default function QuizRenderer({ quiz, onComplete }: Props) {
  switch (quiz.type) {
    case "word-bank-fill":
      return <WordBankFill quiz={quiz} onComplete={onComplete} />;
    case "reorder":
      return <Reorder quiz={quiz} onComplete={onComplete} />;
    case "matching":
      return <Matching quiz={quiz} onComplete={onComplete} />;
    default:
      return (
        <div className="p-4 text-red-600">
          Unknown quiz type: <strong>{(quiz as any).type}</strong>
        </div>
      );
  }
}
