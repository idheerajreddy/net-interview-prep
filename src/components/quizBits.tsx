import type { Difficulty, Question } from "../types";

const LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function toughnessLabel(difficulty: Difficulty) {
  return LABEL[difficulty];
}

export function Toughness({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`toughness toughness-${difficulty}`}>Toughness · {LABEL[difficulty]}</span>;
}

export function mixCounts(items: Question[]) {
  return {
    easy: items.filter((item) => item.difficulty === "easy").length,
    medium: items.filter((item) => item.difficulty === "medium").length,
    hard: items.filter((item) => item.difficulty === "hard").length,
    diagrams: items.filter((item) => item.diagram).length,
  };
}

export function scoreOf(items: Question[], answers: Record<string, string>, checked: string[]) {
  const checkedSet = new Set(checked);
  let correct = 0;
  for (const item of items) {
    if (checkedSet.has(item.id) && answers[item.id] === item.answer) correct += 1;
  }
  return correct;
}
