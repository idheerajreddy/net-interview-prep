import type { DayRecord, Store } from "../types";

const STORAGE_KEY = "net-drill-v1";

export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function previousDateKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

function emptyStore(): Store {
  return { days: {} };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== "object" || !parsed.days) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function loadDay(key: string): DayRecord | null {
  const record = loadStore().days[key];
  if (!record || !Array.isArray(record.questionIds)) return null;
  return {
    date: record.date,
    questionIds: record.questionIds,
    answers: record.answers ?? {},
    checked: record.checked ?? [],
    everFinished: Boolean(record.everFinished),
  };
}

export function saveDay(record: DayRecord) {
  const store = loadStore();
  store.days[record.date] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function currentStreak(today: string): number {
  const finished = new Set(
    Object.values(loadStore().days)
      .filter((day) => day.everFinished)
      .map((day) => day.date),
  );

  let cursor = finished.has(today) ? today : previousDateKey(today);
  if (!finished.has(cursor)) return 0;

  let streak = 0;
  while (finished.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }
  return streak;
}
