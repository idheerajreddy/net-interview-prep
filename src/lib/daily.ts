import type { Difficulty, Question } from "../types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

const PER_DAY: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 3,
};

function diagramCount(set: Question[]): number {
  return set.filter((question) => question.diagram).length;
}

function deal(all: Question[], perDay: number, seed: number): Question[][] {
  const days = Math.floor(all.length / perDay);
  const diagrams = seededShuffle(
    all.filter((question) => question.diagram),
    seed,
  );
  const plain = seededShuffle(
    all.filter((question) => !question.diagram),
    seed + 1,
  );
  const columns: Question[][] = Array.from({ length: days }, () => []);

  for (const question of diagrams) {
    const open = columns
      .map((column, index) => ({ column, index }))
      .filter((entry) => entry.column.length < perDay)
      .sort((a, b) => a.column.filter((item) => item.diagram).length - b.column.filter((item) => item.diagram).length);
    const target = open[0];
    if (!target) break;
    target.column.push(question);
  }

  let plainIndex = 0;
  for (const column of columns) {
    while (column.length < perDay) {
      const next = plain[plainIndex];
      if (!next) {
        throw new Error("Not enough questions to fill a daily set.");
      }
      column.push(next);
      plainIndex += 1;
    }
  }

  return columns;
}

function balanceDiagrams(schedule: Question[][]) {
  let guard = 5000;
  while (guard > 0) {
    guard -= 1;
    const needy = schedule.findIndex((set) => diagramCount(set) < 2);
    if (needy === -1) return;

    let swapped = false;
    for (let donor = 0; donor < schedule.length && !swapped; donor += 1) {
      if (donor === needy || diagramCount(schedule[donor]) <= 2) continue;
      for (let giveAt = 0; giveAt < schedule[donor].length && !swapped; giveAt += 1) {
        const offered = schedule[donor][giveAt];
        if (!offered.diagram) continue;
        const takeAt = schedule[needy].findIndex(
          (question) => !question.diagram && question.difficulty === offered.difficulty,
        );
        if (takeAt === -1) continue;
        const displaced = schedule[needy][takeAt];
        schedule[needy][takeAt] = offered;
        schedule[donor][giveAt] = displaced;
        swapped = true;
      }
    }

    if (!swapped) return;
  }
}

export function buildSchedule(bank: readonly Question[]): Question[][] {
  const grouped = {
    easy: bank.filter((question) => question.difficulty === "easy"),
    medium: bank.filter((question) => question.difficulty === "medium"),
    hard: bank.filter((question) => question.difficulty === "hard"),
  } as const;

  const days = Math.min(
    Math.floor(grouped.easy.length / PER_DAY.easy),
    Math.floor(grouped.medium.length / PER_DAY.medium),
    Math.floor(grouped.hard.length / PER_DAY.hard),
  );

  if (days < 1) {
    throw new Error("Question bank cannot fill a 10-question day.");
  }

  const easy = deal(grouped.easy, PER_DAY.easy, 481_516);
  const medium = deal(grouped.medium, PER_DAY.medium, 2_342);
  const hard = deal(grouped.hard, PER_DAY.hard, 9_781);
  const schedule = Array.from({ length: days }, (_, index) => [
    ...easy[index],
    ...medium[index],
    ...hard[index],
  ]);

  balanceDiagrams(schedule);

  for (const [index, set] of schedule.entries()) {
    if (set.length !== 10) {
      throw new Error(`Day slot ${index} does not have 10 questions.`);
    }
    if (diagramCount(set) < 2) {
      throw new Error(`Day slot ${index} has fewer than 2 diagram questions.`);
    }
    const ids = new Set(set.map((question) => question.id));
    if (ids.size !== set.length) {
      throw new Error(`Day slot ${index} contains a duplicate question.`);
    }
  }

  return schedule;
}

export function questionsForDate(schedule: readonly Question[][], date: Date): Question[] {
  const slot = dayNumber(date) % schedule.length;
  return seededShuffle(schedule[slot], 1_000 + slot);
}

export function cycleLength(schedule: readonly Question[][]): number {
  return schedule.length;
}
