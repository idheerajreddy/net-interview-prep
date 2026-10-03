import type { Question } from "../types";
import { Toughness, mixCounts, scoreOf, toughnessLabel } from "./quizBits";

type ResultsProps = {
  questions: Question[];
  answers: Record<string, string>;
  checked: string[];
  cycleDays: number;
  onHome: () => void;
  onRetry: () => void;
};

export function Results({ questions, answers, checked, cycleDays, onHome, onRetry }: ResultsProps) {
  const correct = scoreOf(questions, answers, checked);
  const mix = mixCounts(questions);
  const byDifficulty = (["easy", "medium", "hard"] as const).map((difficulty) => {
    const items = questions.filter((question) => question.difficulty === difficulty);
    return {
      difficulty,
      correct: scoreOf(items, answers, checked),
      total: items.length,
    };
  });

  const ordered = [...questions].sort((a, b) => {
    const aRight = answers[a.id] === a.answer ? 1 : 0;
    const bRight = answers[b.id] === b.answer ? 1 : 0;
    return aRight - bRight;
  });

  return (
    <main className="shell">
      <p className="kicker">Today's result</p>
      <h1>
        {correct} <span className="out-of">/ 10</span>
      </h1>
      <p className="lede">
        {correct >= 8
          ? "Strong set. Read the ones you missed out loud — that is the interview."
          : correct >= 5
            ? "Solid base. The misses below are the ones worth saying again in your own words."
            : "This set exposed gaps. The explanations are written the way you would answer out loud."}
      </p>

      <ul className="mix">
        {byDifficulty.map((item) => (
          <li key={item.difficulty}>
            {toughnessLabel(item.difficulty)} {item.correct}/{item.total}
          </li>
        ))}
        <li>{mix.diagrams} diagrams in the set</li>
      </ul>

      <div className="actions">
        <button type="button" className="primary" onClick={onHome}>
          Back to today
        </button>
        <button type="button" className="secondary" onClick={onRetry}>
          Retry this set
        </button>
      </div>

      <section className="review">
        {ordered.map((question) => {
          const picked = question.choices.find((choice) => choice.id === answers[question.id]);
          const right = question.choices.find((choice) => choice.id === question.answer);
          const gotIt = answers[question.id] === question.answer;
          return (
            <details key={question.id} open={!gotIt} className={gotIt ? "got-it" : "missed"}>
              <summary>
                <span>{gotIt ? "Correct" : "Missed"}</span>
                <span>{question.topic}</span>
                <Toughness difficulty={question.difficulty} />
              </summary>
              <p className="review-prompt">{question.prompt}</p>
              <p>
                Your answer: {picked ? `${picked.id.toUpperCase()}. ${picked.text}` : "blank"}
              </p>
              {!gotIt && right && (
                <p>
                  Correct answer: {right.id.toUpperCase()}. {right.text}
                </p>
              )}
              {question.explanation.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          );
        })}
      </section>
      <p className="fine">A different set of ten unlocks tomorrow. This one returns in {cycleDays} days.</p>
    </main>
  );
}
