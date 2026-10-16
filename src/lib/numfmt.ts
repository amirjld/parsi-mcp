import { toAsciiDigits, normalizeMobile } from "./validators.js";
import { toPersianDigits } from "./text.js";
import { numberToPersianWords } from "./money.js";
import { persianOrdinal } from "./relative.js";

const UNITS_FA = [{ v: 1e9, w: "میلیارد", l: "B" }, { v: 1e6, w: "میلیون", l: "M" }, { v: 1e3, w: "هزار", l: "K" }];

/** 2500000 -> "۲٫۵ میلیون" (or "2.5M" with style 'latin'). Rounds to maxFraction digits, trims trailing zeros. */
export function formatShortNumber(value: number, opts: { style?: "persian" | "latin"; persianDigits?: boolean; maxFraction?: number; unit?: string } = {}) {
  const { style = "persian", maxFraction = 1, unit } = opts;
  const persianDigits = opts.persianDigits ?? style === "persian";
  if (!Number.isFinite(value)) throw new Error("value must be a finite number");
  const abs = Math.abs(value);
  let u = UNITS_FA.find((x) => abs >= x.v);
  let n = u ? abs / u.v : abs;
  const f = 10 ** maxFraction;
  n = Math.round(n * f) / f;
  if (u && n >= 1000 && u.v < 1e9) u = UNITS_FA[UNITS_FA.indexOf(u) - 1], n = Math.round((abs / u.v) * f) / f;
  let s = String(n);
  if (persianDigits) s = toPersianDigits(s).replace(".", style === "persian" ? "٫" : ".");
  const label = u ? (style === "persian" ? ` ${u.w}` : u.l) : "";
  const sign = value < 0 ? (style === "persian" ? "−" : "-") : "";
  return { text: `${sign}${s}${label}${unit ? " " + unit : ""}`, value, scaled: (value < 0 ? -1 : 1) * n, unitWord: u?.w ?? null };
}

const PLACES = ["", "دهم", "صدم", "هزارم", "ده‌هزارم", "صدهزارم", "میلیونیم"];

/** "12.5" -> "دوازده ممیز پنج دهم"; mode percent appends درصد; mode fraction handles "3/4". */
export function decimalToPersianWords(input: string, mode: "decimal" | "percent" | "fraction" = "decimal", opts: { halfAsNim?: boolean } = {}) {
  const t = toAsciiDigits(input).replace(/[,\u066C\u060C\s]/g, "").replace(/\u066B/g, ".").replace(/%$/, "");
  const neg = t.startsWith("-");
  const body = neg ? t.slice(1) : t;
  const sign = neg ? "منفی " : "";
  if (mode === "fraction") {
    const m = /^(\d+)\/(\d+)$/.exec(body);
    if (!m) throw new Error("fraction must look like 3/4");
    const n = Number(m[1]), d = Number(m[2]);
    if (d === 0) throw new Error("denominator cannot be zero");
    if (opts.halfAsNim && n === 1 && d === 2) return { words: sign + "نیم" };
    return { words: `${sign}${numberToPersianWords(n)} ${persianOrdinal(d, { firstAsYekom: true })}` };
  }
  const m = /^(\d+)(?:\.(\d{1,6}))?$/.exec(body);
  if (!m) throw new Error("not a valid decimal number (max 6 fraction digits)");
  let words = numberToPersianWords(BigInt(m[1]));
  if (m[2]) words += ` ممیز ${numberToPersianWords(Number(m[2]))} ${PLACES[m[2].length]}`;
  if (mode === "percent") words += " درصد";
  return { words: sign + words };
}

/** Display formats for Iranian mobile or landline numbers. */
export function formatIranPhone(value: string, persianDigits = false) {
  const conv = (s: string) => (persianDigits ? toPersianDigits(s) : s);
  const mobile = normalizeMobile(value);
  if (mobile) {
    const n = mobile.slice(1);
    return { type: "mobile", national: conv(`${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}`), dashed: conv(`${mobile.slice(0, 4)}-${mobile.slice(4, 7)}-${mobile.slice(7)}`), international: conv(`+98 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`), e164: `+98${n}` };
  }
  let d = toAsciiDigits(value).replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4); else if (d.startsWith("98") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^[1-8]/.test(d)) throw new Error("Not a recognizable Iranian mobile or landline number");
  const area = d.slice(0, 2), local = d.slice(2);
  return { type: "landline", national: conv(`0${area}-${local}`), dashed: conv(`0${area}-${local.slice(0, 4)}-${local.slice(4)}`), international: conv(`+98 ${area} ${local}`), e164: `+98${d}` };
}
