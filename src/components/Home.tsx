import type { Question } from "../types";
import { mixCounts } from "./quizBits";

type HomeProps = {
  dateLabel: string;
  questions: Question[];
  answered: number;
  correct: number;
  finished: boolean;
  streak: number;
  cycleDays: number;
  onStart: () => void;
  onReview: () => void;
};

export function Home({
  dateLabel,
  questions,
  answered,
  correct,
  finished,
  streak,
  cycleDays,
  onStart,
  onReview,
}: HomeProps) {
  const mix = mixCounts(questions);
  const inProgress = answered > 0 && !finished;

  return (
    <main className="shell">
      <p className="kicker">Net Drill</p>
      <h1>Ten questions before the interview.</h1>
      <p className="lede">
        Computer networks and data center fabrics. Each day is a new set of ten multiple-choice
        questions, marked easy, medium, or hard. A few can only be answered from the diagram.
      </p>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Today</p>
            <h2>{dateLabel}</h2>
          </div>
          <p className="streak">
            <strong>{streak}</strong>
            <span>{streak === 1 ? "day streak" : "days streak"}</span>
          </p>
        </div>

        <ul className="mix">
          <li>{mix.easy} easy</li>
          <li>{mix.medium} medium</li>
          <li>{mix.hard} hard</li>
          <li>{mix.diagrams} diagram</li>
        </ul>

        <div className="topics" aria-label="Topics in today's set">
          {questions.map((question) => (
            <span key={question.id}>{question.topic}</span>
          ))}
        </div>

        {finished ? (
          <div className="actions">
            <p className="status">
              Finished · {correct}/10 correct
            </p>
            <button type="button" className="primary" onClick={onReview}>
              Review answers
            </button>
            <button type="button" className="secondary" onClick={onStart}>
              Retry this set
            </button>
          </div>
        ) : (
          <div className="actions">
            {inProgress && (
              <p className="status">
                {answered} of 10 answered · {correct} correct
              </p>
            )}
            <button type="button" className="primary" onClick={onStart}>
              {inProgress ? "Continue today's drill" : "Start today's drill"}
            </button>
          </div>
        )}
        <p className="fine">
          The bank has {cycleDays * 10} questions and rotates every {cycleDays} days. This exact set
          comes back after that. Progress stays in this browser.
        </p>
      </section>
    </main>
  );
}
