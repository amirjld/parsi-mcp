import { toAsciiDigits } from "./validators.js";

export type Cell = string | number | boolean | null;
export interface CsvOptions { delimiter?: "," | ";" | "\t"; bom?: boolean; excelSafe?: boolean }

const NUMERIC_FA = /^[\s+\-]?[\d\u06F0-\u06F9\u0660-\u0669][\d\u06F0-\u06F9\u0660-\u0669,\u066C\u066B\u060C.]*$/;

/** Excel/Sheets-safe CSV: UTF-8 BOM, RFC 4180 quoting, Persian digits in numeric cells -> ASCII, formula-injection guard (OWASP). */
export function toSafeCsv(rows: Cell[][], opts: CsvOptions = {}) {
  const { delimiter = ",", bom = true, excelSafe = true } = opts;
  const warnings: string[] = [];
  const esc = (cell: Cell, r: number, c: number): string => {
    if (cell === null || cell === undefined) return "";
    if (typeof cell === "number") return String(cell);
    if (typeof cell === "boolean") return cell ? "TRUE" : "FALSE";
    let s = cell;
    if (excelSafe && NUMERIC_FA.test(s) && /[\u06F0-\u06F9\u0660-\u0669\u066B\u066C]/.test(s)) {
      s = toAsciiDigits(s).replace(/[\u066C\u060C,]/g, "").replace(/\u066B/g, ".");
    }
    const isNumber = /^[+-]?\d+(\.\d+)?$/.test(s);
    if (excelSafe && !isNumber && /^[=+\-@\t\r]/.test(s)) { s = "'" + s; warnings.push(`row ${r + 1}, col ${c + 1}: prefixed ' to neutralize formula`); }
    if (excelSafe && /^\d+$/.test(s) && (s.length >= 12 || (s.length > 1 && s.startsWith("0")))) warnings.push(`row ${r + 1}, col ${c + 1}: long/zero-leading digit string (card, national ID, phone) may be altered by Excel when opened; import the column as Text`);
    return /["\r\n]/.test(s) || s.includes(delimiter) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((row, r) => row.map((cell, c) => esc(cell, r, c)).join(delimiter)).join("\r\n");
  return { csv: (bom ? "\uFEFF" : "") + body + "\r\n", warnings };
}
