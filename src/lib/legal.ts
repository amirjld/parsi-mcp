import { toAsciiDigits } from "./validators.js";

/** Iranian legal-entity national ID (شناسه ملی اشخاص حقوقی), 11 digits. Algorithm as documented by persian-tools. */
export function validateLegalId(value: string): { valid: boolean; reason?: string } {
  const s = toAsciiDigits(value).replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(s)) return { valid: false, reason: "must be exactly 11 digits" };
  if (/^0+$/.test(s)) return { valid: false, reason: "all zeros" };
  if (/^0{6}$/.test(s.slice(3, 9))) return { valid: false, reason: "middle six digits are zero" };
  const d = s.split("").map(Number);
  const z = [29, 27, 23, 19, 17];
  const dec = d[9] + 2;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += (dec + d[i]) * z[i % 5];
  let r = sum % 11;
  if (r === 10) r = 0;
  return r === d[10] ? { valid: true } : { valid: false, reason: "checksum mismatch" };
}
