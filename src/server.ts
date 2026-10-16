import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { persianRelativeTime, persianOrdinal } from "./lib/relative.js";
import { jalaliMonthGrid, jalaliPeriodRange } from "./lib/calendar.js";
import { fuzzySearch, persianSort } from "./lib/search.js";
import { fixKeyboardLayout } from "./lib/keyboard.js";
import { validateLegalId } from "./lib/legal.js";
import { toSafeCsv } from "./lib/csv.js";
import { fontPresetCss, FONT_PRESETS } from "./lib/fonts.js";
import { findProvinces } from "./lib/places.js";

import { persianTextStats, detectTextDirection, truncatePersian, persianLorem } from "./lib/textutil.js";
import { formatShortNumber, decimalToPersianWords, formatIranPhone } from "./lib/numfmt.js";
import { jalaliAge, validateJalaliDate, isBusinessDay, addBusinessDays, countBusinessDays, fixedHolidays, LUNAR_HOLIDAYS_HIJRI, todayJalali } from "./lib/dates2.js";
import { parseIranAddress } from "./lib/address.js";

export const VERSION = "0.3.0";

export function createServer(): McpServer {
const server = new McpServer({ name: "parsi-mcp", version: VERSION });
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


const ymd2 = { year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) };
server.tool("persian_relative_time", "Persian relative time like '۳ روز پیش' or '۲ ساعت دیگر'. Pass an ISO timestamp; 'now' defaults to the current time. Months = 30 days, years = 365 days.",
  { timestamp: z.string(), now: z.string().optional(), persianDigits: z.boolean().optional() },
  async ({ timestamp, now, persianDigits }) => safe(() => persianRelativeTime(new Date(timestamp), now ? new Date(now) : new Date(), { persianDigits })));
server.tool("jalali_month_grid", "Calendar grid for a Jalali month (for date-pickers): weeks of 7 cells with day number, Gregorian date and Friday flag; null cells pad the edges. Default week starts Saturday.",
  { year: z.number().int(), month: z.number().int().min(1).max(12), weekStart: z.enum(["saturday", "sunday", "monday"]).optional() },
  async ({ year, month, weekStart }) => safe(() => jalaliMonthGrid(year, month, weekStart)));
server.tool("jalali_period_range", "Start/end (Jalali and Gregorian) of the Jalali day, week (Saturday-Friday), month, quarter (season) or year containing a date. Use for reports and finance periods instead of Gregorian date libraries.",
  { date: z.object(ymd2), period: z.enum(["day", "week", "month", "quarter", "year"]) },
  async ({ date, period }) => safe(() => jalaliPeriodRange(date, period)));
server.tool("persian_ordinal", "Persian ordinal words: 3 -> سوم, 21 -> بیست و یکم, 30 -> سی‌ام. 1 gives اول (set firstAsYekom for یکم).",
  { value: z.number().int().min(0).max(999_999_999), firstAsYekom: z.boolean().optional() },
  async ({ value, firstAsYekom }) => safe(() => ({ ordinal: persianOrdinal(value, { firstAsYekom }) })));
server.tool("persian_fuzzy_search", "Fuzzy-match a query against candidate strings, treating Arabic/Persian letter variants (ي/ی, ك/ک, آ/ا), diacritics, ZWNJ and digit styles as equal. Returns ranked matches with scores.",
  { query: z.string(), candidates: z.array(z.string()).max(5000), threshold: z.number().min(0).max(1).optional(), limit: z.number().int().min(1).max(100).optional() },
  async ({ query, candidates, threshold, limit }) => json({ matches: fuzzySearch(query, candidates, { threshold, limit }) }));
server.tool("persian_sort", "Sort strings in Persian alphabetical order (ا ب پ ت ... ی). Digits first (numeric), then Persian, then Latin. Ignores ZWNJ and Arabic/Persian letter variants.",
  { items: z.array(z.string()).max(10000), order: z.enum(["asc", "desc"]).optional() },
  async ({ items, order }) => json({ sorted: persianSort(items, order) }));
server.tool("fix_keyboard_layout", "Fix text typed with the wrong keyboard layout using the standard Iranian layout (ISIRI 9147): 'sghl' -> 'سلام', and Persian typed on English back to Latin. direction 'auto' picks by script.",
  { text: z.string(), direction: z.enum(["auto", "en-to-fa", "fa-to-en"]).optional() },
  async ({ text, direction }) => json(fixKeyboardLayout(text, direction)));
server.tool("validate_legal_national_id", "Validate an 11-digit Iranian legal-entity national ID (شناسه ملی شخص حقوقی / company ID) with its checksum.",
  { value: z.string() }, async ({ value }) => json(validateLegalId(value)));
server.tool("csv_export_safe", "Build Excel/Sheets-safe CSV from rows: UTF-8 BOM, correct quoting, Persian digits in numeric cells converted to ASCII so Excel treats them as numbers, formula-injection guard, warnings for digit strings Excel may corrupt.",
  { rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))).max(50000), delimiter: z.enum([",", ";", "tab"]).optional(), bom: z.boolean().optional(), excelSafe: z.boolean().optional() },
  async ({ rows, delimiter, bom, excelSafe }) => json(toSafeCsv(rows, { delimiter: delimiter === "tab" ? "\t" : delimiter, bom, excelSafe })));
server.tool("persian_font_preset", "CSS for Persian fonts (vazirmatn, shabnam, sahel, iransans): import link, font stack with fallbacks, RTL base styles. IRANSans is commercial so no CDN is given.",
  { font: z.enum(Object.keys(FONT_PRESETS) as [string, ...string[]]), selector: z.string().optional() },
  async ({ font, selector }) => safe(() => fontPresetCss(font, { selector })));
server.tool("iran_provinces", "List Iran's 31 provinces with ISO 3166-2 code, Persian/English names and capital. Optional query matches Persian or English names (letter-variant tolerant).",
  { query: z.string().optional() }, async ({ query }) => json({ provinces: findProvinces(query) }));


const jd = z.object({ year: z.number().int(), month: z.number().int(), day: z.number().int() });
const jdate = z.union([jd, z.string()]).describe("Jalali date as {year,month,day} or text like '1405/07/24'");
const asJ = (v: z.infer<typeof jdate>) => (typeof v === "string" ? parseJalali(v) : v);
const bizShape = { weekend: z.enum(["friday", "thursday_friday"]).optional().describe("Weekend days; default friday only"), holidays: z.array(z.string()).max(500).optional().describe("Extra Jalali holiday dates you supply, e.g. '1405/01/01'"), includeFixedSolarHolidays: z.boolean().optional() };

server.tool("persian_text_stats", "Character, letter, digit, ZWNJ, word, sentence and paragraph counts for Persian/mixed text, plus reading time. wordsPerMinute is an adjustable assumption (default 180).",
  { text: z.string().max(1_000_000), wordsPerMinute: z.number().positive().max(2000).optional() },
  async ({ text, wordsPerMinute }) => safe(() => persianTextStats(text, wordsPerMinute)));
server.tool("detect_text_direction", "Detect text direction (first-strong and dominant script, mixed flag) and optionally wrap the text bidi-safely: Unicode isolates (FSI/RLI/LRI) or HTML <bdi> / dir=auto. Use for usernames, product names and mixed Persian/English strings.",
  { text: z.string(), wrap: z.enum(["isolate", "rli", "lri", "html-bdi", "html-dir-auto"]).optional() },
  async ({ text, wrap }) => json(detectTextDirection(text, wrap)));
server.tool("truncate_persian_text", "Truncate text to maxLength (ellipsis included) without breaking words, ZWNJ-joined words, surrogate pairs or diacritics. mode 'word' (default) or 'char'.",
  { text: z.string(), maxLength: z.number().int().min(1).max(100000), ellipsis: z.string().max(10).optional(), mode: z.enum(["word", "char"]).optional() },
  async ({ text, maxLength, ellipsis, mode }) => json(truncatePersian(text, maxLength, { ellipsis, mode })));
server.tool("persian_lorem_ipsum", "Deterministic Persian placeholder text (seeded, original word list; not real prose) for mockups.",
  { paragraphs: z.number().int().min(1).max(50).optional(), sentencesPerParagraph: z.number().int().min(1).max(30).optional(), wordsPerSentence: z.number().int().min(3).max(40).optional(), seed: z.number().int().optional() },
  async (a) => json({ text: persianLorem(a) }));
server.tool("format_iran_phone", "Display formats for an Iranian mobile (0912 345 6789, +98 912 345 6789, E.164) or landline (021-12345678). Accepts Persian digits, +98, 0098.",
  { value: z.string(), persianDigits: z.boolean().optional() }, async ({ value, persianDigits }) => safe(() => formatIranPhone(value, persianDigits)));
server.tool("format_short_number", "Short Persian number form: 2500000 -> '۲٫۵ میلیون', 1200 -> '۱٫۲ هزار' (style 'latin' gives 2.5M). Optional unit like تومان.",
  { value: z.number(), style: z.enum(["persian", "latin"]).optional(), persianDigits: z.boolean().optional(), maxFraction: z.number().int().min(0).max(3).optional(), unit: z.string().max(20).optional() },
  async ({ value, ...o }) => safe(() => formatShortNumber(value, o)));
server.tool("decimal_to_persian_words", "Decimals, percents and fractions in Persian words: '12.5' -> 'دوازده ممیز پنج دهم', percent adds درصد, fraction '3/4' -> 'سه چهارم'.",
  { value: z.string(), mode: z.enum(["decimal", "percent", "fraction"]).optional(), halfAsNim: z.boolean().optional() },
  async ({ value, mode, halfAsNim }) => safe(() => decimalToPersianWords(value, mode, { halfAsNim })));
server.tool("jalali_age", "Age (years, months, days, total days) from a Jalali birth date. asOf defaults to today.",
  { birth: jdate, asOf: jdate.optional() }, async ({ birth, asOf }) => safe(() => jalaliAge(asJ(birth), asOf ? asJ(asOf) : todayJalali())));
server.tool("validate_jalali_date", "Form validation for a Jalali date with readable reasons: month/day ranges (leap-aware), min, max and notFuture checks. Never throws.",
  { date: jd, min: jdate.optional(), max: jdate.optional(), notFuture: z.boolean().optional() },
  async ({ date, min, max, notFuture }) => safe(() => validateJalaliDate(date, { min: min ? asJ(min) : undefined, max: max ? asJ(max) : undefined, notFuture })));
server.tool("iran_business_days", "Business-day helper: op 'is_business_day', 'add' (days may be negative) or 'count' (days after 'date' up to and including 'to'). Weekend is Friday (optionally Thursday too); supply holidays yourself or enable the fixed solar ones.",
  { op: z.enum(["is_business_day", "add", "count"]), date: jdate, days: z.number().int().optional(), to: jdate.optional(), ...bizShape },
  async ({ op, date, days, to, ...o }) => safe(() => {
    const d = asJ(date);
    if (op === "is_business_day") return { businessDay: isBusinessDay(d, o) };
    if (op === "add") { if (days === undefined) throw new Error("days is required"); const r = addBusinessDays(d, days, o); return { result: r, formatted: `${r.year}/${String(r.month).padStart(2, "0")}/${String(r.day).padStart(2, "0")}` }; }
    if (!to) throw new Error("to is required"); return { businessDays: countBusinessDays(d, asJ(to), o) };
  }));
server.tool("iran_holidays", "Fixed solar-calendar public holidays of a Jalali year (Nowruz 1-4 Farvardin, 12-13 Farvardin, 14-15 Khordad, 22 Bahman, 29 Esfand) with Gregorian dates, plus the Hijri-based holiday list WITHOUT dates. Lunar holidays shift yearly and need the official annual calendar.",
  { year: z.number().int().min(1).max(3177) },
  async ({ year }) => safe(() => ({ year, fixedSolar: fixedHolidays(year), lunarHolidaysHijri: LUNAR_HOLIDAYS_HIJRI, note: "Lunar (Hijri) holiday dates are not included: they depend on moon sighting and the official yearly calendar." })));
server.tool("parse_iran_address", "Heuristically extract province, city (province capitals only), valid postal code, and plaque/unit/floor numbers from a Persian address string.",
  { text: z.string().max(2000) }, async ({ text }) => json(parseIranAddress(text)));

server.prompt("rtl-frontend-guidelines", "Guidelines for building RTL-first Persian frontends (load before designing UI).",
  async () => ({ messages: [{ role: "user" as const, content: { type: "text" as const, text: rtlGuidelines() } }] }));
server.resource("rtl-frontend-guidelines", "parsi://rtl/frontend-guidelines", { mimeType: "text/markdown", description: "RTL frontend guidelines for Persian UIs" },
  async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: rtlGuidelines() }] }));
return server;
}
