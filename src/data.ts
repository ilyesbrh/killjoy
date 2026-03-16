import type { Lektion, Quiz } from "./types/quiz";

import lektion1Data from "./data/lektion1.json";
import lektion2Data from "./data/lektion2.json";
import lektion3Data from "./data/lektion3.json";
import lektion4Data from "./data/lektion4.json";
import lektion5Data from "./data/lektion5.json";
import lektion6Data from "./data/lektion6.json";
import lektion7Data from "./data/lektion7.json";
import lektion8Data from "./data/lektion8.json";
import lektion9Data from "./data/lektion9.json";
import lektion10Data from "./data/lektion10.json";
import lektion11Data from "./data/lektion11.json";
import lektion12Data from "./data/lektion12.json";

export const lektionen: Lektion[] = [
  lektion1Data,
  lektion2Data,
  lektion3Data,
  lektion4Data,
  lektion5Data,
  lektion6Data,
  lektion7Data,
  lektion8Data,
  lektion9Data,
  lektion10Data,
  lektion11Data,
  lektion12Data,
] as unknown as Lektion[];

// ─── Page Grouping ────────────────────────────────────────────────────

export interface PageGroup {
  key: string;
  label: string;
  type: "kb" | "training" | "test" | "other";
  quizzes: { quiz: Quiz; originalIndex: number }[];
}

function getGroupKey(quiz: Quiz): string {
  if (quiz.reference) {
    return quiz.reference.replace(/(\d)[a-z]+$/i, "$1").trim();
  }
  const section = quiz.section || "";
  if (section === "TEST") return "TEST";
  if (section === "BASISTRAINING") return "BASISTRAINING";
  if (section.startsWith("TRAINING:")) return section;
  return "WEITERE";
}

function getGroupType(key: string): PageGroup["type"] {
  if (key.startsWith("KB")) return "kb";
  if (key === "TEST") return "test";
  if (key === "BASISTRAINING" || key.startsWith("TRAINING:")) return "training";
  return "other";
}

function formatLabel(key: string): string {
  if (key.startsWith("KB")) return key;
  if (key === "TEST") return "Test";
  if (key === "BASISTRAINING") return "Basistraining";
  if (key.startsWith("TRAINING: ")) {
    const s = key.slice("TRAINING: ".length);
    return "Training: " + s.charAt(0) + s.slice(1).toLowerCase();
  }
  return "Weitere";
}

export function groupQuizzesByPage(quizzes: Quiz[]): PageGroup[] {
  const map = new Map<string, { quiz: Quiz; originalIndex: number }[]>();
  const firstIdx = new Map<string, number>();

  quizzes.forEach((quiz, idx) => {
    const key = getGroupKey(quiz);
    if (!map.has(key)) {
      map.set(key, []);
      firstIdx.set(key, idx);
    }
    map.get(key)!.push({ quiz, originalIndex: idx });
  });

  const typePriority: Record<string, number> = {
    kb: 0,
    training: 1,
    other: 2,
    test: 3,
  };

  return [...map.keys()]
    .sort((a, b) => {
      const pa = typePriority[getGroupType(a)] ?? 9;
      const pb = typePriority[getGroupType(b)] ?? 9;
      if (pa !== pb) return pa - pb;
      return (firstIdx.get(a) ?? 0) - (firstIdx.get(b) ?? 0);
    })
    .map((key) => ({
      key,
      label: formatLabel(key),
      type: getGroupType(key),
      quizzes: map.get(key)!,
    }));
}

// ─── Homework Encoding ────────────────────────────────────────────────

export interface HomeworkItem {
  lektion: number; // 1-based lektion number
  indices: number[]; // 0-based quiz indices within that lektion
}

/** Encode: [{lektion:1, indices:[0,3,5]}, {lektion:2, indices:[1]}] → "1:0.3.5,2:1" */
export function encodeHomework(items: HomeworkItem[]): string {
  return items
    .filter((g) => g.indices.length > 0)
    .map((g) => `${g.lektion}:${g.indices.join(".")}`)
    .join(",");
}

/** Decode: "1:0.3.5,2:1" → [{lektion:1, indices:[0,3,5]}, {lektion:2, indices:[1]}] */
export function decodeHomework(encoded: string): HomeworkItem[] {
  if (!encoded) return [];
  return encoded.split(",").map((group) => {
    const [lStr, iStr] = group.split(":");
    return {
      lektion: parseInt(lStr) || 1,
      indices: (iStr || "").split(".").map((s) => parseInt(s) || 0),
    };
  });
}

// ─── Homework History ────────────────────────────────────────────────

const HW_HISTORY_KEY = "killjoy-homework-history";

export interface HomeworkHistoryEntry {
  id: string;
  encoded: string;
  label: string;
  createdAt: number;
  lastOpenedAt: number;
}

function buildLabel(items: HomeworkItem[]): string {
  return items
    .map((g) => `L${g.lektion} (${g.indices.length} Üb.)`)
    .join(" + ");
}

export function getHomeworkHistory(): HomeworkHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HW_HISTORY_KEY);
    const entries: HomeworkHistoryEntry[] = raw ? JSON.parse(raw) : [];
    return entries.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  } catch {
    return [];
  }
}

/** Build a homework URL fragment: "1:0.3.5,2:1" or "1:0.3.5,2:1/My Label" */
export function encodeHomeworkUrl(encoded: string, label?: string): string {
  if (label) return `${encoded}/${label}`;
  return encoded;
}

/** Parse homework URL fragment → { encoded, label? } */
export function decodeHomeworkUrl(raw: string): {
  encoded: string;
  label?: string;
} {
  const slashIdx = raw.indexOf("/");
  if (slashIdx === -1) return { encoded: raw };
  return {
    encoded: raw.slice(0, slashIdx),
    label: decodeURIComponent(raw.slice(slashIdx + 1)) || undefined,
  };
}

export function saveHomeworkToHistory(
  encoded: string,
  items: HomeworkItem[],
  label?: string
): void {
  const entries = getHomeworkHistory();
  const existing = entries.find((e) => e.encoded === encoded);
  if (existing) {
    existing.lastOpenedAt = Date.now();
    if (label) existing.label = label;
  } else {
    entries.push({
      id: String(Date.now()),
      encoded,
      label: label || buildLabel(items),
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    });
  }
  localStorage.setItem(HW_HISTORY_KEY, JSON.stringify(entries));
}

export function deleteHomeworkEntry(id: string): void {
  const entries = getHomeworkHistory().filter((e) => e.id !== id);
  localStorage.setItem(HW_HISTORY_KEY, JSON.stringify(entries));
}
