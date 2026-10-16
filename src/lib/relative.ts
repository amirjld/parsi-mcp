import { toPersianDigits } from "./text.js";
import { numberToPersianWords } from "./money.js";

export interface RelativeTime { text: string; value: number; unit: "second" | "minute" | "hour" | "day" | "month" | "year" | "now"; past: boolean }

/** Persian relative time ("۳ روز پیش", "۲ ساعت دیگر"). Months = 30 days, years = 365 days (approximation, documented). */
export function persianRelativeTime(from: Date, now: Date, opts: { persianDigits?: boolean } = {}): RelativeTime {
  const diffMs = from.getTime() - now.getTime();
  if (Number.isNaN(diffMs)) throw new Error("Invalid date");
  const past = diffMs <= 0;
  const sec = Math.floor(Math.abs(diffMs) / 1000);
  let value: number; let unit: RelativeTime["unit"]; let label: string;
  if (sec < 45) return { text: "همین الان", value: 0, unit: "now", past };
  else if (sec < 3600) { value = Math.max(1, Math.floor(sec / 60)); unit = "minute"; label = "دقیقه"; }
  else if (sec < 86400) { value = Math.floor(sec / 3600); unit = "hour"; label = "ساعت"; }
  else if (sec < 30 * 86400) { value = Math.floor(sec / 86400); unit = "day"; label = "روز"; }
  else if (sec < 365 * 86400) { value = Math.floor(sec / (30 * 86400)); unit = "month"; label = "ماه"; }
  else { value = Math.floor(sec / (365 * 86400)); unit = "year"; label = "سال"; }
  const num = opts.persianDigits === false ? String(value) : toPersianDigits(String(value));
  return { text: `${num} ${label} ${past ? "پیش" : "دیگر"}`, value, unit, past };
}

const ONES_ORD: Record<number, string> = { 1: "اول" };

/** Persian ordinal words: 1 -> اول (or یکم), 3 -> سوم, 21 -> بیست و یکم, 30 -> سی‌ام. */
export function persianOrdinal(n: number, opts: { firstAsYekom?: boolean } = {}): string {
  if (!Number.isInteger(n) || n < 0) throw new Error("Ordinal needs a non-negative integer");
  if (n === 1 && !opts.firstAsYekom) return ONES_ORD[1];
  let words = numberToPersianWords(n);
  if (words === "یک هزار") words = "هزار";
  if (words.endsWith("سه")) return words.slice(0, -2) + "سوم";
  if (words.endsWith("سی")) return words + "\u200Cام";
  return words + "م";
}
