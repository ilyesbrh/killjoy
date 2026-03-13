import type { Quiz } from "../types/quiz";
import WordBankFill from "./WordBankFill";
import Reorder from "./Reorder";
import Matching from "./Matching";
import FillInBlank from "./FillInBlank";
import ImageWordBank from "./ImageWordBank";
import Categorize from "./Categorize";
import InlineChoice from "./InlineChoice";

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
    case "fill-in-blank":
      return <FillInBlank quiz={quiz} onComplete={onComplete} />;
    case "image-word-bank":
      return <ImageWordBank quiz={quiz} onComplete={onComplete} />;
    case "categorize":
      return <Categorize quiz={quiz} onComplete={onComplete} />;
    case "inline-choice":
      return <InlineChoice quiz={quiz} onComplete={onComplete} />;
    default:
      return (
        <div className="p-4 text-red-600">
          Unknown quiz type: <strong>{(quiz as any).type}</strong>
        </div>
      );
  }
}
