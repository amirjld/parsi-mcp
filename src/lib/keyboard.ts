// Standard Iranian Persian layout (ISIRI 9147 / Windows "Persian (Standard)") letter keys.
// Verified against Wikipedia (ISIRI 9147) and kbdlayout.info (kbdfar). Digits, "." and "/" are identical on both layouts.
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,";
const FA = "ضصثقفغعهخحجچشسیبلاتنمکگظطزرذدپو";
const SHIFT_EN = "AFGHJCSM"
const SHIFT_FA = "ؤإأآةژئء"
const en2fa = new Map<string, string>(); const fa2en = new Map<string, string>();
[...EN].forEach((c, i) => { en2fa.set(c, FA[i]); fa2en.set(FA[i], c); });
[...SHIFT_EN].forEach((c, i) => { en2fa.set(c, SHIFT_FA[i]); fa2en.set(SHIFT_FA[i], c); });
fa2en.set("\u064A", "d"); fa2en.set("\u0643", ";"); // Arabic yeh / kaf typed by mistake

export type Direction = "auto" | "en-to-fa" | "fa-to-en";
export function fixKeyboardLayout(text: string, direction: Direction = "auto") {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const persian = (text.match(/\p{Script=Arabic}/gu) ?? []).length;
  const dir: Exclude<Direction, "auto"> = direction === "auto" ? (latin >= persian ? "en-to-fa" : "fa-to-en") : direction;
  const map = dir === "en-to-fa" ? en2fa : fa2en;
  const converted = [...text].map((c) => map.get(c) ?? map.get(c.toLowerCase()) ?? c).join("");
  return { direction: dir, converted, changed: converted !== text };
}
