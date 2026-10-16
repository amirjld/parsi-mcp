import * as jalaali from "jalaali-js";

const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const weekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekday: string;
  formatted: string;
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  const weekday = weekdays[new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay()];
  return { year: jy, month: jm, day: jd, monthName: monthNames[jm - 1], weekday, formatted: `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}` };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number; formatted: string } {
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) throw new Error("Invalid Jalali date");
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return { year: gy, month: gm, day: gd, formatted: `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}` };
}

export function isJalaliLeapYear(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export function jalaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}