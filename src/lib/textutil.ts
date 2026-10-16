import { toAsciiDigits } from "./validators.js";
import { toPersianDigits } from "./text.js";

export function persianTextStats(text: string, wordsPerMinute = 180) {
  if (!(wordsPerMinute > 0)) throw new Error("wordsPerMinute must be positive");
  const chars = [...text];
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)); // ZWNJ does not split a word
  const sentences = text.split(/[.!?؟۔…]+/).filter((s) => /[\p{L}\p{N}]/u.test(s));
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const count = (re: RegExp) => (text.match(re) ?? []).length;
  const seconds = Math.ceil((words.length / wordsPerMinute) * 60);
  const minutes = Math.max(1, Math.round(seconds / 60));
  return {
    characters: chars.length,
    charactersNoSpaces: chars.filter((c) => !/\s/u.test(c)).length,
    letters: count(/\p{L}/gu),
    persianArabicLetters: count(/\p{Script=Arabic}/gu),
    latinLetters: count(/\p{Script=Latin}/gu),
    digits: count(/\p{Nd}/gu),
    zwnj: count(/\u200C/g),
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingTime: { wordsPerMinute, assumption: "wordsPerMinute is an adjustable assumption (default 180), not a standard", seconds, text: words.length === 0 ? "کمتر از یک دقیقه" : seconds < 60 ? "کمتر از یک دقیقه" : `حدود ${toPersianDigits(String(minutes))} دقیقه` },
  };
}

const RTL_RE = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
const LTR_RE = /\p{L}/u;
export type WrapMode = "isolate" | "rli" | "lri" | "html-bdi" | "html-dir-auto";

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** First-strong direction (Unicode UAX #9 P2/P3 idea; letters only) plus a mixed-content ratio. */
export function detectTextDirection(text: string, wrap?: WrapMode) {
  let first: "rtl" | "ltr" | "neutral" = "neutral";
  let rtl = 0, ltr = 0;
  for (const ch of text) {
    if (RTL_RE.test(ch)) { rtl++; if (first === "neutral") first = "rtl"; }
    else if (LTR_RE.test(ch)) { ltr++; if (first === "neutral") first = "ltr"; }
  }
  const total = rtl + ltr;
  const dominant = total === 0 ? "neutral" : rtl / total > 0.5 ? "rtl" : ltr / total > 0.5 ? "ltr" : "mixed";
  const result: Record<string, unknown> = { firstStrong: first, dominant, mixed: rtl > 0 && ltr > 0, rtlLetters: rtl, ltrLetters: ltr, suggestedDir: first === "neutral" ? "auto" : first };
  if (wrap) {
    const FSI = "\u2068", PDI = "\u2069", RLI = "\u2067", LRI = "\u2066";
    result.wrapped = { isolate: FSI + text + PDI, rli: RLI + text + PDI, lri: LRI + text + PDI, "html-bdi": `<bdi>${escHtml(text)}</bdi>`, "html-dir-auto": `<span dir="auto">${escHtml(text)}</span>` }[wrap];
    result.wrapMode = wrap;
  }
  return result;
}

/** Truncate without splitting a word (ZWNJ words stay whole), surrogate pair, or combining mark. maxLength counts the ellipsis. */
export function truncatePersian(text: string, maxLength: number, opts: { ellipsis?: string; mode?: "word" | "char" } = {}) {
  const { ellipsis = "…", mode = "word" } = opts;
  const chars = [...text];
  if (chars.length <= maxLength) return { text, truncated: false };
  const budget = Math.max(0, maxLength - [...ellipsis].length);
  let end = budget;
  while (end > 0 && (/[\u064B-\u065F\u0670\u200C\u200D]/.test(chars[end] ?? "") || /[\u200C\u200D]/.test(chars[end - 1] ?? ""))) end--;
  if (mode === "word" && !/\s/.test(chars[end] ?? "")) {
    let w = end;
    while (w > 0 && !/\s/.test(chars[w - 1])) w--;
    if (w > 0) end = w;
  }
  const cut = chars.slice(0, end).join("").replace(/[\s\u200C\u200D،,;:؛\-–]+$/u, "");
  return { text: cut + ellipsis, truncated: true };
}

const WORDS = "کتاب خانه روز شب آسمان زمین دریا کوه باران برف باد درخت گل برگ رودخانه شهر روستا مسیر سفر دوست خانواده کار زندگی امید آرامش صبح غروب ستاره ماه خورشید نور سایه صدا سکوت داستان خاطره رویا آینده گذشته دانش هنر موسیقی باغ حیاط پنجره دیوار چراغ کوچه خیابان بازار چای نان میوه آب خاک آتش راه قلم کاغذ نامه".split(" ");
const CONNECT = ["و", "با", "در", "برای", "از", "تا", "که", "همچنین", "اما"];
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Deterministic Persian placeholder text (original word list; not real prose). */
export function persianLorem(opts: { paragraphs?: number; sentencesPerParagraph?: number; wordsPerSentence?: number; seed?: number; persianDigits?: boolean } = {}) {
  const { paragraphs = 1, sentencesPerParagraph = 4, wordsPerSentence = 9, seed = 1 } = opts;
  const r = rng(seed);
  const pick = (a: string[]) => a[Math.floor(r() * a.length)];
  const out: string[] = [];
  for (let p = 0; p < paragraphs; p++) {
    const ss: string[] = [];
    for (let s = 0; s < sentencesPerParagraph; s++) {
      const n = Math.max(3, wordsPerSentence + Math.floor(r() * 5) - 2);
      const ws: string[] = [];
      for (let i = 0; i < n; i++) ws.push(i > 0 && i % 4 === 0 ? pick(CONNECT) : pick(WORDS));
      ss.push(ws.join(" ") + ".");
    }
    out.push(ss.join(" "));
  }
  return out.join("\n\n");
}
void toAsciiDigits;
