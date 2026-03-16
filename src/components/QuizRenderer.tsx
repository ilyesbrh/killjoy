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
  let content: React.ReactNode;

  switch (quiz.type) {
    case "word-bank-fill":
      content = <WordBankFill quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "reorder":
      content = <Reorder quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "matching":
      content = <Matching quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "fill-in-blank":
      content = <FillInBlank quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "image-word-bank":
      content = <ImageWordBank quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "categorize":
      content = <Categorize quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "inline-choice":
      content = <InlineChoice quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "write-sentences":
      content = <WriteSentences quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    case "table-fill":
      content = <TableFill quiz={quiz} onComplete={onComplete} onReset={onReset} stateKey={stateKey} />;
      break;
    default:
      return (
        <div className="p-4 text-red-600">
          Unknown quiz type: <strong>{(quiz as any).type}</strong>
        </div>
      );
  }

  return (
    <>
      {quiz.audio && <SoundCloudPlayer url={quiz.audio} />}
      {content}
    </>
  );
}

function SoundCloudPlayer({ url }: { url: string }) {
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236366f1&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;

  return (
    <div className="max-w-2xl mx-auto px-6 mb-2">
      <iframe
        title="Audio"
        width="100%"
        height="80"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        className="rounded-lg"
      />
    </div>
  );
}
