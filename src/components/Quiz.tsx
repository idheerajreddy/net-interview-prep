import { useEffect, useState } from "react";
import type { ChoiceId, Question } from "../types";
import { DiagramFigure } from "./Diagram";
import { Toughness, scoreOf } from "./quizBits";

type QuizProps = {
  questions: Question[];
  answers: Record<string, string>;
  checked: string[];
  onCheck: (id: string, choice: ChoiceId) => void;
  onDone: () => void;
  onExit: () => void;
};

export function Quiz({ questions, answers, checked, onCheck, onDone, onExit }: QuizProps) {
  const firstOpen = questions.findIndex((question) => !checked.includes(question.id));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [pending, setPending] = useState<ChoiceId | null>(null);
  const question = questions[index];
  const revealed = checked.includes(question.id);
  const selected = (revealed ? answers[question.id] : pending) as ChoiceId | null;
  const correctCount = scoreOf(questions, answers, checked);

  useEffect(() => {
    setPending(null);
  }, [question.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLButtonElement && event.key === "Enter") return;
      const choiceIndex = ["1", "2", "3", "4"].indexOf(event.key);
      if (choiceIndex >= 0 && !revealed) {
        setPending(question.choices[choiceIndex].id);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!revealed && pending) onCheck(question.id, pending);
        else if (revealed) goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function goNext() {
    if (index < questions.length - 1) {
      setPending(null);
      setIndex(index + 1);
      return;
    }
    const earlier = questions.findIndex((item) => !checked.includes(item.id));
    if (earlier !== -1) {
      setPending(null);
      setIndex(earlier);
      return;
    }
    onDone();
  }

  function goBack() {
    if (index === 0) return;
    setPending(null);
    setIndex(index - 1);
  }

  return (
    <main className="shell quiz-shell">
      <header className="quiz-bar">
        <button type="button" className="text-button" onClick={onExit}>
          Today
        </button>
        <p>
          {String(index + 1).padStart(2, "0")} / {questions.length}
        </p>
        <p>{correctCount} correct</p>
      </header>
      <ol className="ticks" aria-label="Question progress">
        {questions.map((item, itemIndex) => {
          const done = checked.includes(item.id);
          const right = done && answers[item.id] === item.answer;
          const state = itemIndex === index ? "current" : done ? (right ? "right" : "wrong") : "todo";
          return (
            <li key={item.id}>
              <button type="button" className={`tick tick-${state}`} onClick={() => { setPending(null); setIndex(itemIndex); }} aria-label={`Question ${itemIndex + 1}`}>
                {itemIndex + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <article className="card" key={question.id}>
        <div className="card-meta">
          <span className="topic">{question.topic}</span>
          <Toughness difficulty={question.difficulty} />
        </div>
        <h1>{question.prompt}</h1>
        {question.exhibit && <pre className="exhibit">{question.exhibit}</pre>}
        {question.diagram && <DiagramFigure diagram={question.diagram} />}

        <div className="choices" role="radiogroup" aria-label="Answer choices">
          {question.choices.map((choice, choiceIndex) => {
            const isSelected = selected === choice.id;
            const isAnswer = choice.id === question.answer;
            let state = "";
            if (revealed && isAnswer) state = "correct";
            else if (revealed && isSelected) state = "wrong";
            else if (isSelected) state = "selected";
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`choice ${state}`}
                aria-disabled={revealed}
                onClick={() => {
                  if (!revealed) setPending(choice.id);
                }}
              >
                <span className="letter">{choice.id.toUpperCase()}</span>
                <span>{choice.text}</span>
                <span className="key-hint">{choiceIndex + 1}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="explanation">
            <p className="eyebrow">{answers[question.id] === question.answer ? "Correct" : "Not quite"}</p>
            {question.explanation.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        <div className="card-actions">
          <button type="button" className="secondary" onClick={goBack} disabled={index === 0}>
            Back
          </button>
          {!revealed ? (
            <button
              type="button"
              className="primary"
              disabled={!pending}
              onClick={() => pending && onCheck(question.id, pending)}
            >
              Check answer
            </button>
          ) : (
            <button type="button" className="primary" onClick={goNext}>
              {index === questions.length - 1 && questions.every((item) => checked.includes(item.id))
                ? "See results"
                : "Next question"}
            </button>
          )}
        </div>
        <p className="fine keys">Keys 1–4 choose an answer. Enter checks it, then moves on.</p>
      </article>
    </main>
  );
}
