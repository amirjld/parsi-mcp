const digitsOnly = (s: string) => s.replace(/[\s-]/g, "");

/** Convert Persian/Arabic-Indic digits to ASCII. */
export function toAsciiDigits(s: string): string {
  return s
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Iranian national ID (code melli) checksum validation. */
export function validateNationalId(input: string): boolean {
  const id = digitsOnly(toAsciiDigits(input));
  if (!/^\d{10}$/.test(id)) return false;
  if (/^(\d)\1{9}$/.test(id)) return false;
  const sum = [...id.slice(0, 9)].reduce((a, d, i) => a + Number(d) * (10 - i), 0);
  const r = sum % 11;
  const check = Number(id[9]);
  return r < 2 ? check === r : check === 11 - r;
}

/** Luhn check, used for Iranian bank card numbers (16 digits). */
export function validateCardNumber(input: string): boolean {
  const n = digitsOnly(toAsciiDigits(input));
  if (!/^\d{16}$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(n[15 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Iranian Sheba (IBAN) validation: IR + 24 digits, mod-97 check. */
export function validateSheba(input: string): boolean {
  const s = digitsOnly(toAsciiDigits(input)).toUpperCase();
  if (!/^IR\d{24}$/.test(s)) return false;
  const rearranged = s.slice(4) + "1827" + s.slice(2, 4);
  let rem = 0;
  for (const ch of rearranged) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

/** Iranian mobile number validation; returns normalized 09xxxxxxxxx or null. */
export function normalizeMobile(input: string): string | null {
  let s = digitsOnly(toAsciiDigits(input)).replace(/^\+/, "");
  if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98")) s = "0" + s.slice(2);
  else if (/^9\d{9}$/.test(s)) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}