import { questions } from "../data/questions.ts";
import { buildSchedule, questionsForDate, dayNumber } from "./daily.ts";

const schedule = buildSchedule(questions);
const difficulties = ["easy", "medium", "hard"] as const;
let failed = 0;

function fail(message: string) {
  failed += 1;
  console.error(message);
}

const ids = new Set<string>();
const prompts = new Set<string>();
for (const question of questions) {
  if (ids.has(question.id)) fail(`duplicate id ${question.id}`);
  ids.add(question.id);
  if (prompts.has(question.prompt)) fail(`duplicate prompt on ${question.id}`);
  prompts.add(question.prompt);
  if (question.choices.length !== 4) fail(`${question.id} does not have 4 choices`);
  if (!question.choices.some((choice) => choice.id === question.answer)) {
    fail(`${question.id} answer is not one of the choices`);
  }
  if (question.explanation.trim().length < 40) fail(`${question.id} explanation is too short`);
  if (question.diagram?.kind === "topology") {
    const nodeIds = new Set(question.diagram.nodes.map((node) => node.id));
    for (const edge of question.diagram.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        fail(`${question.id} has a dangling edge ${edge.from}->${edge.to}`);
      }
    }
  }
}

const answerCounts = { a: 0, b: 0, c: 0, d: 0 };
for (const question of questions) answerCounts[question.answer] += 1;
for (const [letter, count] of Object.entries(answerCounts)) {
  if (count < 12) fail(`answer ${letter} only appears ${count} times`);
}

const expected = { easy: 300, medium: 400, hard: 300 } as const;
for (const difficulty of difficulties) {
  const count = questions.filter((question) => question.difficulty === difficulty).length;
  if (count !== expected[difficulty]) fail(`${difficulty} count is ${count}, expected ${expected[difficulty]}`);
}

if (questions.length !== 1000) fail(`bank is ${questions.length}, expected 1000`);
if (schedule.length !== 100) fail(`cycle is ${schedule.length}, expected 100`);

const seen = new Map<string, number>();
for (let slot = 0; slot < schedule.length; slot += 1) {
  const set = schedule[slot];
  const mix = {
    easy: set.filter((question) => question.difficulty === "easy").length,
    medium: set.filter((question) => question.difficulty === "medium").length,
    hard: set.filter((question) => question.difficulty === "hard").length,
    diagrams: set.filter((question) => question.diagram).length,
  };
  if (mix.easy !== 3 || mix.medium !== 4 || mix.hard !== 3) fail(`slot ${slot} mix ${JSON.stringify(mix)}`);
  if (mix.diagrams < 2) fail(`slot ${slot} has ${mix.diagrams} diagrams`);
  for (const question of set) {
    if (seen.has(question.id)) fail(`${question.id} appears in slot ${seen.get(question.id)} and ${slot}`);
    seen.set(question.id, slot);
  }
}

if (seen.size !== 1000) fail(`scheduled ${seen.size} questions, expected 1000`);

function dateForSlot(slot: number) {
  for (let offset = 0; offset < schedule.length + 2; offset += 1) {
    const date = new Date(2026, 0, 1 + offset);
    if (dayNumber(date) % schedule.length === slot) return date;
  }
  throw new Error(`no date for slot ${slot}`);
}

const first = questionsForDate(schedule, dateForSlot(0)).map((question) => question.id);
const again = questionsForDate(schedule, dateForSlot(0)).map((question) => question.id);
if (first.join() !== again.join()) fail("same slot is not stable");

const weekLater = questionsForDate(schedule, new Date(dateForSlot(0).getFullYear(), dateForSlot(0).getMonth(), dateForSlot(0).getDate() + schedule.length));
if (weekLater.map((question) => question.id).sort().join() !== [...first].sort().join()) {
  fail("cycle did not repeat after one full rotation");
}

if (failed > 0) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}

console.log(`ok: ${questions.length} questions, ${schedule.length}-day cycle, today's slot sample ${first.length}`);
