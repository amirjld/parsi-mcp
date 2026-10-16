import * as jalaali from "jalaali-js";
import { JALALI_MONTHS } from "./jalaliExtra.js";

const pad = (n: number) => String(n).padStart(2, "0");
const SAT_INDEX = (utcDay: number) => (utcDay + 1) % 7; // Saturday=0 ... Friday=6

export interface GridCell { day: number; gregorian: string; isFriday: boolean }
export function jalaliMonthGrid(year: number, month: number, weekStart: "saturday" | "sunday" | "monday" = "saturday") {
  if (!jalaali.isValidJalaaliDate(year, month, 1)) throw new Error("Invalid Jalali year/month");
  const length = jalaali.jalaaliMonthLength(year, month);
  const startIdx = { saturday: 0, sunday: 1, monday: 2 }[weekStart];
  const cells: (GridCell | null)[] = [];
  const first = jalaali.toGregorian(year, month, 1);
  const firstSat = SAT_INDEX(new Date(Date.UTC(first.gy, first.gm - 1, first.gd)).getUTCDay());
  for (let i = 0; i < (firstSat - startIdx + 7) % 7; i++) cells.push(null);
  for (let d = 1; d <= length; d++) {
    const g = jalaali.toGregorian(year, month, d);
    const dow = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay();
    cells.push({ day: d, gregorian: `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`, isFriday: dow === 5 });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (GridCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const order = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  const weekdayLabels = [...order.slice(startIdx), ...order.slice(0, startIdx)];
  return { year, month, monthName: JALALI_MONTHS[month - 1], length, weekStart, weekdayLabels, weeks };
}

export type Period = "day" | "week" | "month" | "quarter" | "year";
const utcToJalaali = (gy: number, gm: number, gd: number) => { const t = new Date(Date.UTC(gy, gm - 1, gd)); return jalaali.toJalaali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
const toIso = (jy: number, jm: number, jd: number) => { const g = jalaali.toGregorian(jy, jm, jd); return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`; };
const jf = (jy: number, jm: number, jd: number) => `${jy}/${pad(jm)}/${pad(jd)}`;

/** Start/end of a Jalali day/week(Sat-Fri)/month/quarter(season)/year containing the given Jalali date. */
export function jalaliPeriodRange(date: { year: number; month: number; day: number }, period: Period) {
  const { year: y, month: m, day: d } = date;
  if (!jalaali.isValidJalaaliDate(y, m, d)) throw new Error("Invalid Jalali date");
  let s: [number, number, number]; let e: [number, number, number];
  if (period === "day") { s = e = [y, m, d]; }
  else if (period === "month") { s = [y, m, 1]; e = [y, m, jalaali.jalaaliMonthLength(y, m)]; }
  else if (period === "quarter") { const q = Math.floor((m - 1) / 3); const sm = q * 3 + 1, em = sm + 2; s = [y, sm, 1]; e = [y, em, jalaali.jalaaliMonthLength(y, em)]; }
  else if (period === "year") { s = [y, 1, 1]; e = [y, 12, jalaali.jalaaliMonthLength(y, 12)]; }
  else {
    const g = jalaali.toGregorian(y, m, d);
    const idx = SAT_INDEX(new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay());
    const sj = utcToJalaali(g.gy, g.gm, g.gd - idx);
    const ej = utcToJalaali(g.gy, g.gm, g.gd - idx + 6);
    s = [sj.jy, sj.jm, sj.jd]; e = [ej.jy, ej.jm, ej.jd];
  }
  return { period, jalali: { from: jf(...s), to: jf(...e) }, gregorian: { from: toIso(...s), to: toIso(...e) }, label: period === "month" ? `${JALALI_MONTHS[m - 1]} ${y}` : undefined };
}
