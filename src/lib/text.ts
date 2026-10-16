import { toAsciiDigits } from "./validators.js";

export function toPersianDigits(s: string): string {
  return toAsciiDigits(s).replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)));
}

/** Normalize Arabic letter variants to Persian ones and unify digits. */
export function normalizePersian(s: string): string {
  return toPersianDigits(
    s
      .replace(/\u064A/g, "\u06CC") // Arabic yeh -> Persian yeh
      .replace(/\u0649/g, "\u06CC")
      .replace(/\u0643/g, "\u06A9") // Arabic kaf -> Persian keh
      .replace(/\u0640/g, "") // tatweel
      .replace(/[\u064B-\u0652]/g, "") // harakat
      .replace(/\u200C{2,}/g, "\u200C")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}