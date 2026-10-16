import * as jalaali from "jalaali-js";
import { toAsciiDigits } from "./validators.js";
import { toPersianDigits } from "./text.js";

export const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
export const WEEKDAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]; // index = JS getUTCDay()

export interface J { year: number; month: number; day: number }

function check(d: J): J {
  if (!jalaali.isValidJalaaliDate(d.year, d.month, d.day)) throw new Error("Invalid Jalali date");
  return d;
}
function toUtc(d: J): Date {
  const g = jalaali.toGregorian(d.year, d.month, d.day);
  return new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
}
function fromUtc(dt: Date): J {
  const j = jalaali.toJalaali(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  return { year: j.jy, month: j.jm, day: j.jd };
}
const pad = (n: number) => String(n).padStart(2, "0");

export function jalaliWeekday(d: J): string { return WEEKDAYS_FA[toUtc(check(d)).getUTCDay()]; }

/** Tokens: YYYY YY MM M MMMM DD D dddd. Set persianDigits to convert digits. */
export function formatJalali(d: J, pattern = "YYYY/MM/DD", persianDigits = false): string {
  check(d);
  const map: Record<string, string> = {
    YYYY: String(d.year), YY: String(d.year % 100).padStart(2, "0"), MMMM: JALALI_MONTHS[d.month - 1], MM: pad(d.month), M: String(d.month),
    DD: pad(d.day), D: String(d.day), dddd: jalaliWeekday(d),
  };
  const out = pattern.replace(/YYYY|YY|MMMM|MM|M|DD|D|dddd/g, (t) => map[t]);
  return persianDigits ? toPersianDigits(out) : out;
}

/** Parse "1403/05/09", "۱۴۰۳-۵-۹" or "9 مرداد 1403" (Persian or ASCII digits). */
export function parseJalali(text: string): J {
  const t = toAsciiDigits(text).replace(/\u200C/g, "").trim();
  let m = /^(\d{4})\D+(\d{1,2})\D+(\d{1,2})$/.exec(t);
  if (m) return check({ year: +m[1], month: +m[2], day: +m[3] });
  m = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(t);
  if (m) {
    const idx = JALALI_MONTHS.indexOf(m[2]);
    if (idx >= 0) return check({ year: +m[3], month: idx + 1, day: +m[1] });
  }
  throw new Error("Unrecognized Jalali date format");
}

export function addDaysJalali(d: J, days: number): J {
  const dt = toUtc(check(d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUtc(dt);
}

/** Add months/years; the day is clamped to the target month length (31 Shahrivar-style overflow). */
export function addMonthsJalali(d: J, months: number): J {
  check(d);
  const total = d.year * 12 + (d.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12 + 12) % 12 + 1;
  return { year, month, day: Math.min(d.day, jalaali.jalaaliMonthLength(year, month)) };
}

export function diffDaysJalali(a: J, b: J): number {
  return Math.round((toUtc(check(b)).getTime() - toUtc(check(a)).getTime()) / 86400000);
}

/** Persian relative description of b relative to a, e.g. "۳ روز بعد", "۲ ماه پیش", "امروز". */
export function relativeJalali(from: J, to: J): { days: number; text: string } {
  const days = diffDaysJalali(from, to);
  const abs = Math.abs(days);
  if (days === 0) return { days, text: "امروز" };
  if (days === 1) return { days, text: "فردا" };
  if (days === -1) return { days, text: "دیروز" };
  let n: number, unit: string;
  if (abs < 30) { n = abs; unit = "روز"; }
  else if (abs < 365) { n = Math.floor(abs / 30); unit = "ماه"; }
  else { n = Math.floor(abs / 365); unit = "سال"; }
  return { days, text: `${toPersianDigits(String(n))} ${unit} ${days > 0 ? "بعد" : "پیش"}` };
}
