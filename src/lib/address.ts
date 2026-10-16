import { toAsciiDigits } from "./validators.js";
import { normalizeForSearch } from "./search.js";
import { IRAN_PROVINCES } from "./places.js";
import { validatePostalCode } from "./phone.js";

/** Heuristic parser: province, province-capital city, postal code, پلاک/واحد/طبقه. Only the 31 provinces and their capitals are recognized. */
export function parseIranAddress(text: string) {
  const ascii = toAsciiDigits(text);
  const postal = [...ascii.matchAll(/(?<!\d)\d{5}[\s-]?\d{5}(?!\d)/g)].map((m) => validatePostalCode(m[0])).find((p) => p.valid);
  const norm = normalizeForSearch(text);
  const has = (needle: string) => new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(norm);
  const byLen = [...IRAN_PROVINCES].sort((a, b) => normalizeForSearch(b.fa).length - normalizeForSearch(a.fa).length);
  let province = byLen.find((p) => has(normalizeForSearch(p.fa)));
  let cityMatch = IRAN_PROVINCES.find((p) => has(normalizeForSearch(p.capitalFa)) && (!province || p === province)) ?? (province ? undefined : undefined);
  if (!province && cityMatch) province = cityMatch;
  const city = cityMatch ? { fa: cityMatch.capitalFa, en: cityMatch.capitalEn } : null;
  const num = (word: string) => { const m = new RegExp(`${word}\\s*(?:شماره)?\\s*[:：]?\\s*(\\d+)`).exec(ascii.replace(/\u200C/g, "")); return m ? m[1] : null; };
  return {
    province: province ? { fa: province.fa, en: province.en, iso: province.iso } : null,
    city,
    postalCode: postal ? postal.normalized : null,
    plaque: num("پلاک"), unit: num("واحد"), floor: num("طبقه"),
    note: "Heuristic. A city is only detected when it is a province capital; other cities need a larger dataset.",
  };
}
