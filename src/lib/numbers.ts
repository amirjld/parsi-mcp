import { toAsciiDigits } from "./validators.js";
import { toPersianDigits } from "./text.js";
import { numberToPersianWords } from "./money.js";

export interface GroupOptions { digits?: "ascii" | "persian"; separator?: "," | "٬"; groupSize?: number }

/** Clean typed text into { sign, int, frac } using ASCII digits only. Accepts Persian/Arabic digits and common separators. */
function split(text: string) {
  const t = toAsciiDigits(String(text))
    .replace(/[٬,،\s\u066C\u00A0_']/g, "")
    .replace(/[٫\u066B]/g, ".");
  const m = /^([-+\u2212]?)(\d*)(?:\.(\d*))?/.exec(t);
  const sign = m && (m[1] === "-" || m[1] === "\u2212") ? "-" : "";
  const int = (m?.[2] ?? "").replace(/^0+(?=\d)/, "");
  const frac = m?.[3];
  return { sign, int, frac };
}

/** Format a number string or number with thousands separators, e.g. 200000 -> "200,000" or "۲۰۰٬۰۰۰". */
export function formatNumberGrouped(value: string | number, opts: GroupOptions = {}): string {
  const { digits = "ascii", separator = ",", groupSize = 3 } = opts;
  const raw = typeof value === "number" ? (Number.isFinite(value) ? (Math.abs(value) >= 1e21 ? BigInt(Math.trunc(value)).toString() : String(value)) : "") : value;
  const { sign, int, frac } = split(raw);
  if (!int && frac === undefined) return "";
  const grouped = (int || "0").replace(new RegExp("\\B(?=(\\d{" + groupSize + "})+(?!\\d))", "g"), separator);
  let out = sign + grouped;
  if (frac !== undefined) out += (digits === "persian" ? "٫" : ".") + frac;
  return digits === "persian" ? toPersianDigits(out) : out;
}

/** Strip separators and Persian/Arabic digits to a clean ASCII number string, plus the numeric value. */
export function parseGroupedNumber(text: string): { raw: string; value: number | null } {
  const { sign, int, frac } = split(text);
  if (!int && !frac) return { raw: "", value: null };
  const raw = sign + (int || "0") + (frac ? "." + frac : "");
  return { raw, value: Number(raw) };
}

export type PriceUnit = "toman" | "rial";
const unitFa: Record<PriceUnit, string> = { toman: "تومان", rial: "ریال" };

/** Amount (string or number) to Persian words with unit, e.g. 200000 toman -> "دویست هزار تومان". Fractions: toman supports one decimal digit (tenths = rials). */
export function priceToPersianWords(amount: string | number, unit: PriceUnit = "toman"): string {
  const { sign, int, frac } = split(String(amount));
  if (!int && !frac) throw new Error("Not a number");
  const whole = BigInt(int || "0");
  const fracDigits = (frac ?? "").replace(/0+$/, "");
  let text: string;
  if (!fracDigits) {
    text = (whole === 0n ? "صفر" : numberToPersianWords(whole)) + " " + unitFa[unit];
  } else if (unit === "toman" && fracDigits.length === 1) {
    const rial = Number(fracDigits);
    text = (whole === 0n ? "" : numberToPersianWords(whole) + " " + unitFa.toman + " و ") + numberToPersianWords(rial) + " " + unitFa.rial;
  } else {
    throw new Error(unit === "toman" ? "Toman supports at most one decimal digit (tenths = rials)" : "Rial amounts must be whole numbers");
  }
  return sign ? "منفی " + text : text;
}
