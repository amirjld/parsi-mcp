import * as jalaali from "jalaali-js";
import { type J, JALALI_MONTHS, parseJalali, formatJalali } from "./jalaliExtra.js";

const MS = 86400000;
const pad = (n: number) => String(n).padStart(2, "0");
const toDayNum = (d: J) => { const g = jalaali.toGregorian(d.year, d.month, d.day); return Date.UTC(g.gy, g.gm - 1, g.gd) / MS; };
const fromDayNum = (n: number): J => { const t = new Date(n * MS); const j = jalaali.toJalaali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); return { year: j.jy, month: j.jm, day: j.jd }; };
const cmp = (a: J, b: J) => a.year - b.year || a.month - b.month || a.day - b.day;
export const todayJalali = (now = new Date()): J => fromDayNum(Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / MS));

export interface Fixed { month: number; day: number; fa: string; en: string }
// Fixed solar-calendar public holidays (per Wikipedia "Public holidays in Iran"). Lunar holidays vary yearly and need the official annual calendar.
export const FIXED_SOLAR_HOLIDAYS: Fixed[] = [
  { month: 1, day: 1, fa: "نوروز", en: "Nowruz" }, { month: 1, day: 2, fa: "نوروز", en: "Nowruz" }, { month: 1, day: 3, fa: "نوروز", en: "Nowruz" }, { month: 1, day: 4, fa: "نوروز", en: "Nowruz" },
  { month: 1, day: 12, fa: "روز جمهوری اسلامی", en: "Islamic Republic Day" }, { month: 1, day: 13, fa: "سیزده‌بدر", en: "Sizdah Bedar" },
  { month: 3, day: 14, fa: "رحلت امام خمینی", en: "Death of Khomeini" }, { month: 3, day: 15, fa: "قیام ۱۵ خرداد", en: "15 Khordad uprising" },
  { month: 11, day: 22, fa: "پیروزی انقلاب اسلامی", en: "Anniversary of the Islamic Revolution" }, { month: 12, day: 29, fa: "ملی شدن صنعت نفت", en: "Nationalization of the oil industry" },
];
export const LUNAR_HOLIDAYS_HIJRI = [
  { month: "Muharram", day: 9, en: "Tasua" }, { month: "Muharram", day: 10, en: "Ashura" }, { month: "Safar", day: 20, en: "Arbaeen" }, { month: "Safar", day: 28, en: "Death of Muhammad and Hasan ibn Ali" },
  { month: "Rabi' al-awwal", day: 8, en: "Death of Hasan al-Askari" }, { month: "Rabi' al-awwal", day: 17, en: "Birth of Muhammad and Ja'far al-Sadiq" }, { month: "Jumada al-thani", day: 3, en: "Death of Fatima" },
  { month: "Rajab", day: 13, en: "Birth of Ali" }, { month: "Rajab", day: 27, en: "Mission of Muhammad" }, { month: "Sha'ban", day: 15, en: "Birth of Mahdi" }, { month: "Ramadan", day: 21, en: "Death of Ali" },
  { month: "Shawwal", day: 1, en: "Eid al-Fitr" }, { month: "Shawwal", day: 2, en: "Eid al-Fitr (day 2)" }, { month: "Shawwal", day: 25, en: "Death of Ja'far al-Sadiq" }, { month: "Dhu al-Hijjah", day: 10, en: "Eid al-Adha" }, { month: "Dhu al-Hijjah", day: 18, en: "Eid al-Ghadir" },
];
export function fixedHolidays(year: number) {
  return FIXED_SOLAR_HOLIDAYS.map((h) => {
    const g = jalaali.toGregorian(year, h.month, h.day);
    const dow = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay();
    return { jalali: `${year}/${pad(h.month)}/${pad(h.day)}`, gregorian: `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`, nameFa: h.fa, nameEn: h.en, isFriday: dow === 5 };
  });
}

/** Years/months/days between a Jalali birth date and a reference date (borrowing uses Jalali month lengths). */
export function jalaliAge(birth: J, asOf: J) {
  if (!jalaali.isValidJalaaliDate(birth.year, birth.month, birth.day) || !jalaali.isValidJalaaliDate(asOf.year, asOf.month, asOf.day)) throw new Error("Invalid Jalali date");
  if (cmp(birth, asOf) > 0) throw new Error("Birth date is after the reference date");
  let y = asOf.year - birth.year, m = asOf.month - birth.month, d = asOf.day - birth.day;
  if (d < 0) { m--; const pm = asOf.month === 1 ? 12 : asOf.month - 1; const py = asOf.month === 1 ? asOf.year - 1 : asOf.year; d += jalaali.jalaaliMonthLength(py, pm); }
  if (m < 0) { y--; m += 12; }
  return { years: y, months: m, days: d, totalDays: toDayNum(asOf) - toDayNum(birth), isBirthdayToday: birth.month === asOf.month && birth.day === asOf.day };
}

export interface ValidateOpts { min?: J; max?: J; notFuture?: boolean; today?: J }
/** Form-friendly Jalali date validation with human-readable reasons (never throws). */
export function validateJalaliDate(d: J, opts: ValidateOpts = {}) {
  const errors: string[] = [];
  if (!Number.isInteger(d.year) || d.year < 1 || d.year > 3177) errors.push("year must be between 1 and 3177");
  else if (!Number.isInteger(d.month) || d.month < 1 || d.month > 12) errors.push("month must be between 1 and 12");
  else {
    const len = jalaali.jalaaliMonthLength(d.year, d.month);
    if (!Number.isInteger(d.day) || d.day < 1 || d.day > len) errors.push(`day must be between 1 and ${len} for ${JALALI_MONTHS[d.month - 1]} ${d.year}`);
  }
  if (errors.length === 0) {
    if (opts.min && cmp(d, opts.min) < 0) errors.push(`date is before ${formatJalali(opts.min)}`);
    if (opts.max && cmp(d, opts.max) > 0) errors.push(`date is after ${formatJalali(opts.max)}`);
    if (opts.notFuture && cmp(d, opts.today ?? todayJalali()) > 0) errors.push("date is in the future");
  }
  return { valid: errors.length === 0, errors, isLeapYear: Number.isInteger(d.year) && d.year >= 1 && d.year <= 3177 ? jalaali.isLeapJalaaliYear(d.year) : undefined };
}

export interface BizOpts { weekend?: "friday" | "thursday_friday"; holidays?: string[]; includeFixedSolarHolidays?: boolean }
function bizChecker(opts: BizOpts) {
  const weekend = opts.weekend === "thursday_friday" ? [4, 5] : [5];
  const extra = new Set((opts.holidays ?? []).map((h) => toDayNum(parseJalali(h))));
  return (n: number): boolean => {
    if (weekend.includes(new Date(n * MS).getUTCDay())) return false;
    if (extra.has(n)) return false;
    if (opts.includeFixedSolarHolidays) { const j = fromDayNum(n); if (FIXED_SOLAR_HOLIDAYS.some((h) => h.month === j.month && h.day === j.day)) return false; }
    return true;
  };
}
export function isBusinessDay(date: J, opts: BizOpts = {}) { return bizChecker(opts)(toDayNum(date)); }
export function addBusinessDays(start: J, days: number, opts: BizOpts = {}): J {
  if (!Number.isInteger(days) || Math.abs(days) > 3650) throw new Error("days must be an integer within ±3650");
  const ok = bizChecker(opts); let n = toDayNum(start); const step = days < 0 ? -1 : 1;
  for (let left = Math.abs(days); left > 0;) { n += step; if (ok(n)) left--; }
  return fromDayNum(n);
}
/** Business days in (from, to] — counts days after `from` up to and including `to`; negative if to < from. */
export function countBusinessDays(from: J, to: J, opts: BizOpts = {}): number {
  const a = toDayNum(from), b = toDayNum(to); if (Math.abs(b - a) > 3660) throw new Error("range too large (max ~10 years)");
  const ok = bizChecker(opts); let c = 0;
  if (b >= a) { for (let n = a + 1; n <= b; n++) if (ok(n)) c++; return c; }
  for (let n = b + 1; n <= a; n++) if (ok(n)) c++; return -c;
}
export { fromDayNum, toDayNum };
