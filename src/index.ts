#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validateNationalId, validateCardNumber, validateSheba, normalizeMobile } from "./lib/validators.js";
import { toPersianDigits, normalizePersian } from "./lib/text.js";
import { numberToPersianWords, convertCurrency } from "./lib/money.js";
import { gregorianToJalali, jalaliToGregorian, isJalaliLeapYear, jalaliMonthLength } from "./lib/jalali.js";

import { bankFromCard, bankFromSheba } from "./lib/banks.js";
import { mobileOperator, landlineProvince, validatePostalCode } from "./lib/phone.js";
import { calcVat } from "./lib/tax.js";
import { persianWordsToNumber } from "./lib/words.js";
import { formatNumberGrouped, parseGroupedNumber, priceToPersianWords } from "./lib/numbers.js";
import { formatJalali, parseJalali, addDaysJalali, addMonthsJalali, diffDaysJalali, relativeJalali, jalaliWeekday } from "./lib/jalaliExtra.js";
import { slugifyPersian, sanitizePersianText } from "./lib/slug.js";
import { auditRtl, convertCss, convertTailwind } from "./lib/rtl.js";
import { rtlGuidelines, rtlStarterSnippet, priceInputSnippet } from "./lib/assets.js";
const server = new McpServer({ name: "parsi-mcp", version: "0.2.0" });
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

const ymd = { year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) };
const safe = <T>(f: () => T) => { try { return json(f()); } catch (e) { return fail(e); } };

server.tool("bank_from_card", "Identify the Iranian bank from a card number (first 6 digits / BIN).",
  { card: z.string() }, async ({ card }) => safe(() => bankFromCard(card)));
server.tool("bank_from_sheba", "Identify the Iranian bank from a Sheba (IBAN) number (3-digit bank code).",
  { sheba: z.string() }, async ({ sheba }) => safe(() => bankFromSheba(sheba)));
server.tool("mobile_operator", "Detect the mobile operator (MCI/Irancell/Rightel) of an Iranian mobile number.",
  { value: z.string() }, async ({ value }) => json(mobileOperator(value) ?? { valid: false }));
server.tool("landline_province", "Find the province of an Iranian landline number from its area code.",
  { value: z.string() }, async ({ value }) => safe(() => landlineProvince(value)));
server.tool("validate_postal_code", "Validate an Iranian 10-digit postal code.",
  { value: z.string() }, async ({ value }) => json(validatePostalCode(value)));
server.tool("persian_words_to_number", "Convert Persian number words to a number, e.g. 'دویست و پنجاه هزار' -> 250000.",
  { text: z.string() }, async ({ text }) => safe(() => ({ value: persianWordsToNumber(text) })));
server.tool("format_jalali_date", "Format a Jalali date. Tokens: YYYY YY MMMM MM M DD D dddd.",
  { ...ymd, pattern: z.string().optional(), persianDigits: z.boolean().optional() },
  async ({ year, month, day, pattern, persianDigits }) => safe(() => ({ text: formatJalali({ year, month, day }, pattern, persianDigits), weekday: jalaliWeekday({ year, month, day }) })));
server.tool("parse_jalali_date", "Parse text like '1403/05/09', '۱۴۰۳-۵-۹' or '9 مرداد 1403' into a Jalali date.",
  { text: z.string() }, async ({ text }) => safe(() => parseJalali(text)));
server.tool("jalali_add", "Add days, months and/or years to a Jalali date (month overflow clamps to month length).",
  { ...ymd, days: z.number().int().optional(), months: z.number().int().optional(), years: z.number().int().optional() },
  async ({ year, month, day, days = 0, months = 0, years = 0 }) => safe(() => {
    const r = addDaysJalali(addMonthsJalali({ year, month, day }, months + years * 12), days);
    return { ...r, formatted: formatJalali(r) };
  }));
server.tool("jalali_diff", "Days between two Jalali dates plus a Persian relative description.",
  { from: z.object(ymd), to: z.object(ymd) }, async ({ from, to }) => safe(() => ({ days: diffDaysJalali(from, to), relative: relativeJalali(from, to).text })));
server.tool("slugify_persian", "Create a URL slug from Persian/Latin text.",
  { text: z.string(), separator: z.string().optional() }, async ({ text, separator }) => json({ slug: slugifyPersian(text, separator) }));
server.tool("sanitize_persian_text", "Fix ZWNJ (half-space) for می/نمی and plural suffixes, Persian punctuation and spacing, Arabic letter variants.",
  { text: z.string() }, async ({ text }) => json({ text: sanitizePersianText(text) }));
server.tool("calculate_vat", "VAT helper. Rate (percent) must be supplied. mode 'exclusive' = amount excludes tax, 'inclusive' = amount includes tax.",
  { amount: z.number(), ratePercent: z.number(), mode: z.enum(["exclusive", "inclusive"]) },
  async ({ amount, ratePercent, mode }) => safe(() => calcVat(amount, ratePercent, mode)));

server.tool("format_number_grouped", "Group digits in threes (200000 -> 200,000 or ۲۰۰٬۰۰۰). Accepts Persian/Arabic digits.",
  { value: z.string(), digits: z.enum(["ascii", "persian"]).optional(), separator: z.enum([",", "٬"]).optional() },
  async ({ value, digits, separator }) => json({ text: formatNumberGrouped(value, { digits, separator }) }));
server.tool("parse_grouped_number", "Strip separators and Persian/Arabic digits to a clean number, e.g. '۲۰۰٬۰۰۰' -> '200000'.",
  { text: z.string() }, async ({ text }) => json(parseGroupedNumber(text)));
server.tool("price_to_persian_words", "Amount in Persian words with unit, e.g. 200000 toman -> 'دویست هزار تومان'. Toman may have one decimal digit (tenths = rials).",
  { amount: z.string(), unit: z.enum(["toman", "rial"]).optional() },
  async ({ amount, unit }) => safe(() => ({ words: priceToPersianWords(amount, unit ?? "toman") })));
server.tool("price_input_snippet", "Ready-to-use RTL-friendly price input code: digit grouping while typing with caret preserved, live Persian words (aria-live), raw value submission. variant 'core' returns the shared helpers.",
  { variant: z.enum(["react", "vue", "vanilla", "core"]) }, async ({ variant }) => safe(() => ({ variant, code: priceInputSnippet(variant) })));

server.tool("rtl_guidelines", "Full RTL frontend guidelines for Persian/Arabic UIs (also available as prompt and resource 'rtl-frontend-guidelines').",
  {}, async () => ({ content: [{ type: "text" as const, text: rtlGuidelines() }] }));
server.tool("rtl_audit_css", "Scan CSS/HTML/JSX/Tailwind text for LTR-only patterns (margin-left, ml-4, text-align:left, float:left, left/right, forced ltr, directional icons...) and suggest logical replacements.",
  { code: z.string() }, async ({ code }) => json(auditRtl(code)));
server.tool("rtl_convert_css", "Convert physical CSS (and React style objects) to logical properties.",
  { css: z.string() }, async ({ css }) => json(convertCss(css)));
server.tool("rtl_convert_tailwind", "Convert Tailwind physical utilities to logical ones (ml-4 -> ms-4, pr-2 -> pe-2, text-left -> text-start).",
  { text: z.string() }, async ({ text }) => json(convertTailwind(text)));
server.tool("rtl_starter_snippet", "Minimal RTL-ready setup for html, css, tailwind, nextjs, react or vue.",
  { framework: z.enum(["html", "css", "tailwind", "nextjs", "react", "vue"]) }, async ({ framework }) => safe(() => ({ framework, code: rtlStarterSnippet(framework) })));

server.prompt("rtl-frontend-guidelines", "Guidelines for building RTL-first Persian frontends (load before designing UI).",
  async () => ({ messages: [{ role: "user" as const, content: { type: "text" as const, text: rtlGuidelines() } }] }));
server.resource("rtl-frontend-guidelines", "parsi://rtl/frontend-guidelines", { mimeType: "text/markdown", description: "RTL frontend guidelines for Persian UIs" },
  async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: rtlGuidelines() }] }));

await server.connect(new StdioServerTransport());
