/** Normalize text for search/indexing: unify Arabic/Persian letter variants, drop diacritics/tatweel/ZWNJ, ASCII digits, lowercase. */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u064A\u0649\u06D2]/g, "\u06CC") // ي ى ے -> ی
    .replace(/\u0643/g, "\u06A9") // ك -> ک
    .replace(/\u0629/g, "\u0647") // ة -> ه
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ -> ا
    .replace(/\u0624/g, "\u0648") // ؤ -> و
    .replace(/\u0626/g, "\u06CC") // ئ -> ی
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat, dagger alef, tatweel
    .replace(/[\u200C\u200D\u200E\u200F]/g, "") // ZWNJ, ZWJ, LRM, RLM
    .replace(/[\u060C\u061B\u061F.,;:!?()[\]{}"'«»\-_/\\]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const A = [...a], B = [...b];
  let prev = Array.from({ length: B.length + 1 }, (_, i) => i);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[B.length];
}

const sim = (a: string, b: string) => (a === b ? 1 : 1 - levenshtein(a, b) / Math.max([...a].length, [...b].length, 1));

export function fuzzyScore(query: string, candidate: string): number {
  const q = normalizeForSearch(query), c = normalizeForSearch(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.startsWith(q)) return 0.95;
  if (c.includes(q)) return 0.9;
  const qt = q.split(" "), ct = c.split(" ");
  const tokenScores = qt.map((t) => Math.max(...ct.map((x) => (x.startsWith(t) ? 0.95 : sim(t, x)))));
  const tokenAvg = tokenScores.reduce((a, b) => a + b, 0) / tokenScores.length;
  return Math.max(sim(q, c), tokenAvg * 0.9);
}

export function fuzzySearch(query: string, candidates: string[], opts: { threshold?: number; limit?: number } = {}) {
  const { threshold = 0.6, limit = 10 } = opts;
  return candidates
    .map((text, index) => ({ text, index, score: Math.round(fuzzyScore(query, text) * 1000) / 1000 }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit);
}

// Persian alphabet order (ISIRI / Dehkhoda convention): ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی
const ALPHABET = "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی";
function sortKey(ch: string): [number, number] {
  if (ch === " ") return [0, 0];
  if (/\d/.test(ch)) return [1, Number(ch)];
  const i = ALPHABET.indexOf(ch);
  if (i >= 0) return [2, i];
  if (/\p{Script=Arabic}/u.test(ch)) return [3, ch.codePointAt(0)!];
  if (/\p{Script=Latin}/u.test(ch)) return [4, ch.codePointAt(0)!];
  return [5, ch.codePointAt(0)!];
}
/** Persian-aware comparator: digits < Persian letters (alphabet order, آ=ا, ي=ی, ك=ک, ZWNJ ignored) < Latin < other. Digit runs compare numerically. */
export function persianCompare(a: string, b: string): number {
  const ta = normalizeForSort(a).match(/\d+|[\s\S]/gu) ?? [], tb = normalizeForSort(b).match(/\d+|[\s\S]/gu) ?? [];
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const x = ta[i], y = tb[i];
    if (/^\d{2,}$/.test(x) || /^\d{2,}$/.test(y) || (/^\d$/.test(x) && /^\d$/.test(y))) {
      if (/^\d+$/.test(x) && /^\d+$/.test(y)) { const d = Number(x) - Number(y); if (d) return d < 0 ? -1 : 1; continue; }
    }
    const kx = sortKey(x), ky = sortKey(y);
    if (kx[0] !== ky[0]) return kx[0] - ky[0];
    if (kx[1] !== ky[1]) return kx[1] < ky[1] ? -1 : 1;
  }
  if (ta.length !== tb.length) return ta.length < tb.length ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}
function normalizeForSort(s: string): string {
  return normalizeForSearch(s).replace(/[^\p{L}\p{N} ]/gu, "");
}
export function persianSort(items: string[], order: "asc" | "desc" = "asc"): string[] {
  const out = [...items].sort(persianCompare);
  return order === "desc" ? out.reverse() : out;
}
