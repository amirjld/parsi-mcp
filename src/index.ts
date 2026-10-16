#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validateNationalId, validateCardNumber, validateSheba, normalizeMobile } from "./lib/validators.js";
import { toPersianDigits, normalizePersian } from "./lib/text.js";
import { numberToPersianWords, convertCurrency } from "./lib/money.js";
import { gregorianToJalali, jalaliToGregorian, isJalaliLeapYear, jalaliMonthLength } from "./lib/jalali.js";

const server = new McpServer({ name: "parsi-mcp", version: "0.1.0" });
const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const fail = (e: unknown) => ({ isError: true, content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }] });

server.tool("gregorian_to_jalali", "Convert a Gregorian date to the Jalali (Persian) calendar.",
  { year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) },
  async ({ year, month, day }) => json(gregorianToJalali(year, month, day)));

server.tool("jalali_to_gregorian", "Convert a Jalali (Persian) date to the Gregorian calendar.",
  { year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) },
  async ({ year, month, day }) => { try { return json(jalaliToGregorian(year, month, day)); } catch (e) { return fail(e); } });

server.tool("jalali_year_info", "Leap-year status and month length for a Jalali year.",
  { year: z.number().int(), month: z.number().int().min(1).max(12).optional() },
  async ({ year, month }) => json({ year, isLeap: isJalaliLeapYear(year), monthLength: month ? jalaliMonthLength(year, month) : undefined }));

server.tool("validate_national_id", "Validate an Iranian national ID (code melli) using its checksum.",
  { value: z.string() }, async ({ value }) => json({ valid: validateNationalId(value) }));

server.tool("validate_card_number", "Validate a 16-digit Iranian bank card number (Luhn).",
  { value: z.string() }, async ({ value }) => json({ valid: validateCardNumber(value) }));

server.tool("validate_sheba", "Validate an Iranian Sheba (IBAN) number.",
  { value: z.string() }, async ({ value }) => json({ valid: validateSheba(value) }));

server.tool("normalize_mobile", "Validate and normalize an Iranian mobile number to 09xxxxxxxxx.",
  { value: z.string() }, async ({ value }) => { const n = normalizeMobile(value); return json({ valid: n !== null, normalized: n }); });

server.tool("normalize_persian_text", "Normalize Arabic letter variants to Persian, clean spacing, and convert digits to Persian.",
  { text: z.string() }, async ({ text }) => json({ text: normalizePersian(text) }));

server.tool("to_persian_digits", "Convert any digits in a string to Persian digits.",
  { text: z.string() }, async ({ text }) => json({ text: toPersianDigits(text) }));

server.tool("number_to_persian_words", "Write a non-negative integer in Persian words, e.g. for invoices.",
  { value: z.number().int() }, async ({ value }) => { try { return json({ words: numberToPersianWords(value) }); } catch (e) { return fail(e); } });

server.tool("convert_rial_toman", "Convert between rial and toman (1 toman = 10 rial).",
  { amount: z.number(), from: z.enum(["rial", "toman"]), to: z.enum(["rial", "toman"]) },
  async ({ amount, from, to }) => json({ amount: convertCurrency(amount, from, to), unit: to }));

await server.connect(new StdioServerTransport());