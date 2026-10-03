import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";
import { scoreOf } from "./components/quizBits";
import { questionById, questions } from "./data/questions";
import { buildSchedule, cycleLength, questionsForDate } from "./lib/daily";
import { currentStreak, dateKey, loadDay, saveDay } from "./lib/storage";
import type { ChoiceId, DayRecord } from "./types";

const schedule = buildSchedule(questions);

function freshDay(date: Date): DayRecord {
  return {
    date: dateKey(date),
    questionIds: questionsForDate(schedule, date).map((question) => question.id),
    answers: {},
    checked: [],
    everFinished: false,
  };
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const key = dateKey(today);
  const [day, setDay] = useState<DayRecord>(() => {
    const stored = loadDay(key);
    if (stored && stored.questionIds.every((id) => questionById[id])) return stored;
    return freshDay(today);
  });
  const [view, setView] = useState<"home" | "quiz" | "results">("home");

  useEffect(() => {
    saveDay(day);
  }, [day]);

  const todays = day.questionIds
    .map((id) => questionById[id])
    .filter((question) => question != null);
  const finished = day.checked.length === todays.length && todays.length > 0;
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function check(id: string, choice: ChoiceId) {
    setDay((current) => {
      if (current.checked.includes(id)) return current;
      const checked = [...current.checked, id];
      return {
        ...current,
        answers: { ...current.answers, [id]: choice },
        checked,
        everFinished: current.everFinished || checked.length === current.questionIds.length,
      };
    });
  }

  function retry() {
    setDay((current) => ({
      ...current,
      answers: {},
      checked: [],
    }));
    setView("quiz");
  }

  return (
    <>
      {view === "home" && (
        <Home
          dateLabel={dateLabel}
          questions={todays}
          answered={day.checked.length}
          correct={scoreOf(todays, day.answers, day.checked)}
          finished={finished}
          streak={currentStreak(key)}
          cycleDays={cycleLength(schedule)}
          onStart={() => {
            if (finished) retry();
            else setView("quiz");
          }}
          onReview={() => setView("results")}
        />
      )}
      {view === "quiz" && (
        <Quiz
          questions={todays}
          answers={day.answers}
          checked={day.checked}
          onCheck={check}
          onDone={() => setView("results")}
          onExit={() => setView("home")}
        />
      )}
      {view === "results" && (
        <Results
          questions={todays}
          answers={day.answers}
          checked={day.checked}
          cycleDays={cycleLength(schedule)}
          onHome={() => setView("home")}
          onRetry={retry}
        />
      )}
    </>
  );
}
