import { toAsciiDigits, normalizeMobile } from "./validators.js";

export type Operator = "MCI" | "Irancell" | "Rightel";

function inRange(n: number, a: number, b: number) { return n >= a && n <= b; }

/** Detect the mobile operator from the 4-digit prefix (09xx). Returns null when the prefix is not in the verified list. */
export function mobileOperator(value: string): { normalized: string; operator: Operator | null; prefix: string } | null {
  const normalized = normalizeMobile(value);
  if (!normalized) return null;
  const prefix = normalized.slice(0, 4);
  const p = Number(prefix);
  let operator: Operator | null = null;
  if (inRange(p, 910, 919) || inRange(p, 990, 994)) operator = "MCI";
  else if (inRange(p, 900, 905) || p === 930 || p === 933 || inRange(p, 935, 939) || p === 941) operator = "Irancell";
  else if (inRange(p, 920, 923)) operator = "Rightel";
  return { normalized, operator, prefix };
}

const provinces: Record<string, { fa: string; en: string }> = {
  "21": { fa: "تهران", en: "Tehran" },
  "26": { fa: "البرز", en: "Alborz" },
  "25": { fa: "قم", en: "Qom" },
  "31": { fa: "اصفهان", en: "Isfahan" },
  "34": { fa: "کرمان", en: "Kerman" },
  "35": { fa: "یزد", en: "Yazd" },
  "38": { fa: "چهارمحال و بختیاری", en: "Chaharmahal and Bakhtiari" },
  "41": { fa: "آذربایجان شرقی", en: "East Azerbaijan" },
  "44": { fa: "آذربایجان غربی", en: "West Azerbaijan" },
  "45": { fa: "اردبیل", en: "Ardabil" },
  "51": { fa: "خراسان رضوی", en: "Razavi Khorasan" },
  "54": { fa: "سیستان و بلوچستان", en: "Sistan and Baluchestan" },
  "56": { fa: "خراسان جنوبی", en: "South Khorasan" },
  "58": { fa: "خراسان شمالی", en: "North Khorasan" },
  "61": { fa: "خوزستان", en: "Khuzestan" },
  "66": { fa: "لرستان", en: "Lorestan" },
  "71": { fa: "فارس", en: "Fars" },
  "74": { fa: "کهگیلویه و بویراحمد", en: "Kohgiluyeh and Boyer-Ahmad" },
  "76": { fa: "هرمزگان", en: "Hormozgan" },
  "77": { fa: "بوشهر", en: "Bushehr" },
  "81": { fa: "همدان", en: "Hamadan" },
  "83": { fa: "کرمانشاه", en: "Kermanshah" },
  "84": { fa: "ایلام", en: "Ilam" },
  "86": { fa: "مرکزی", en: "Markazi" },
  "87": { fa: "کردستان", en: "Kurdistan" },
  "11": { fa: "مازندران", en: "Mazandaran" },
  "13": { fa: "گیلان", en: "Gilan" },
  "17": { fa: "گلستان", en: "Golestan" },
  "23": { fa: "سمنان", en: "Semnan" },
  "24": { fa: "زنجان", en: "Zanjan" },
  "28": { fa: "قزوین", en: "Qazvin" },
};

/** Province lookup from a landline number's area code (province level only). */
export function landlineProvince(value: string): { areaCode: string; province: { fa: string; en: string } | null; local: string } {
  let d = toAsciiDigits(value).replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || d.startsWith("9")) throw new Error("Not an Iranian landline number (expected area code + 8 digits)");
  const code = d.slice(0, 2);
  return { areaCode: "0" + code, province: provinces[code] ?? null, local: d.slice(2) };
}

/** Iranian postal code: 10 digits, no 0 or 2 in the first five, no 2 anywhere, 5th digit not 5, first four not identical. */
export function validatePostalCode(value: string): { valid: boolean; normalized: string; prefix?: string } {
  const n = toAsciiDigits(value).replace(/[\s-]/g, "");
  const valid = /^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/.test(n);
  return valid ? { valid, normalized: n, prefix: n.slice(0, 5) } : { valid, normalized: n };
}

