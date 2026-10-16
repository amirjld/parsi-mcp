import { toAsciiDigits } from "./validators.js";

const ones: Record<string, number> = {
  "صفر": 0, "یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5, "شش": 6, "شیش": 6, "هفت": 7, "هشت": 8, "نه": 9, "ده": 10,
  "یازده": 11, "دوازده": 12, "سیزده": 13, "چهارده": 14, "پانزده": 15, "پونزده": 15, "شانزده": 16, "شونزده": 16,
  "هفده": 17, "هجده": 18, "نوزده": 19, "بیست": 20, "سی": 30, "چهل": 40, "پنجاه": 50, "شصت": 60, "هفتاد": 70,
  "هشتاد": 80, "نود": 90, "صد": 100, "یکصد": 100, "دویست": 200, "سیصد": 300, "چهارصد": 400, "پانصد": 500,
  "ششصد": 600, "هفتصد": 700, "هشتصد": 800, "نهصد": 900,
};
const scales: Record<string, bigint> = {
  "هزار": 1000n, "میلیون": 1000000n, "ملیون": 1000000n, "میلیارد": 1000000000n, "بیلیون": 1000000000n,
  "تریلیون": 1000000000000n, "تریلیارد": 1000000000000000n,
};

/** Parse Persian words ("یک میلیون و دویست و پنجاه هزار") into an integer. */
export function persianWordsToNumber(text: string): number {
  const cleaned = text.replace(/[\u064A]/g, "\u06CC").replace(/\u0643/g, "\u06A9").replace(/\u200C/g, " ").trim();
  if (!cleaned) throw new Error("Empty input");
  if (/^[\d\u06F0-\u06F9\u0660-\u0669]+$/.test(cleaned)) return Number(toAsciiDigits(cleaned));
  let tokens = cleaned.split(/\s+/).filter((t) => t !== "و");
  let negative = false;
  if (tokens[0] === "منفی") { negative = true; tokens = tokens.slice(1); }
  if (!tokens.length) throw new Error("No number words found");
  let total = 0n, current = 0n;
  for (const t of tokens) {
    if (t in ones) current += BigInt(ones[t]);
    else if (t in scales) { total += (current === 0n ? 1n : current) * scales[t]; current = 0n; }
    else throw new Error("Unknown number word: " + t);
  }
  const result = total + current;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Number too large");
  return negative ? -Number(result) : Number(result);
}
