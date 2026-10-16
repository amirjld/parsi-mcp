const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) parts.push(hundreds[Math.floor(n / 100)]);
  const r = n % 100;
  if (r > 0) parts.push(r < 20 ? ones[r] : tens[Math.floor(r / 10)] + (r % 10 ? " و " + ones[r % 10] : ""));
  return parts.join(" و ");
}

/** Convert a non-negative integer to Persian words. */
export function numberToPersianWords(value: number | bigint): string {
  let n = BigInt(value);
  if (n < 0n) return "منفی " + numberToPersianWords(-n);
  if (n === 0n) return "صفر";
  const groups: number[] = [];
  while (n > 0n) {
    groups.push(Number(n % 1000n));
    n /= 1000n;
  }
  if (groups.length > scales.length) throw new Error("Number too large");
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    parts.push(below1000(groups[i]) + (scales[i] ? " " + scales[i] : ""));
  }
  return parts.join(" و ");
}

export function convertCurrency(amount: number, from: "rial" | "toman", to: "rial" | "toman"): number {
  if (from === to) return amount;
  return from === "toman" ? amount * 10 : amount / 10;
}