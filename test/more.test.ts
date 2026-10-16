import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { persianRelativeTime, persianOrdinal } from "../src/lib/relative.js";
import { jalaliMonthGrid, jalaliPeriodRange } from "../src/lib/calendar.js";
import { fuzzySearch, persianSort, normalizeForSearch } from "../src/lib/search.js";
import { fixKeyboardLayout } from "../src/lib/keyboard.js";
import { validateLegalId } from "../src/lib/legal.js";
import { toSafeCsv } from "../src/lib/csv.js";
import { fontPresetCss } from "../src/lib/fonts.js";
import { findProvinces, IRAN_PROVINCES } from "../src/lib/places.js";
import { buildToolsMarkdown } from "../scripts/tools-doc.js";

test("relative time", () => {
  const now = new Date("2026-10-16T00:00:00Z");
  assert.equal(persianRelativeTime(new Date("2026-10-13T00:00:00Z"), now).text, "۳ روز پیش");
  assert.equal(persianRelativeTime(new Date("2026-10-16T02:00:00Z"), now).text, "۲ ساعت دیگر");
  assert.equal(persianRelativeTime(new Date("2026-10-16T00:00:10Z"), now).text, "همین الان");
  assert.equal(persianRelativeTime(new Date("2026-04-16T00:00:00Z"), now, { persianDigits: false }).text, "6 ماه پیش");
});
test("ordinals", () => {
  const w = [1, 2, 3, 13, 21, 23, 30, 33, 100, 1000].map((n) => persianOrdinal(n));
  assert.deepEqual(w, ["اول", "دوم", "سوم", "سیزدهم", "بیست و یکم", "بیست و سوم", "سی\u200Cام", "سی و سوم", "صدم", "هزارم"]);
  assert.equal(persianOrdinal(1, { firstAsYekom: true }), "یکم");
});
test("month grid", () => {
  const g = jalaliMonthGrid(1405, 7); // Mehr 1405 starts Wed 2026-09-23
  assert.equal(g.length, 30);
  assert.equal(g.weeks[0].filter((c) => c === null).length, 4);
  assert.equal(g.weeks[0][4]?.gregorian, "2026-09-23");
  assert.ok(g.weeks.every((w) => w.length === 7));
  assert.equal(g.weeks[0][6]?.isFriday, true);
  assert.equal(jalaliMonthGrid(1403, 12).length, 30); // leap year
  assert.equal(jalaliMonthGrid(1404, 12).length, 29);
});
test("period ranges", () => {
  const w = jalaliPeriodRange({ year: 1405, month: 7, day: 24 }, "week"); // Fri 2026-10-16
  assert.deepEqual(w.gregorian, { from: "2026-10-10", to: "2026-10-16" });
  assert.deepEqual(w.jalali, { from: "1405/07/18", to: "1405/07/24" });
  assert.equal(jalaliPeriodRange({ year: 1403, month: 12, day: 5 }, "year").jalali.to, "1403/12/30");
  assert.equal(jalaliPeriodRange({ year: 1405, month: 5, day: 5 }, "quarter").jalali.from, "1405/04/01");
});
test("search normalize + fuzzy", () => {
  assert.equal(normalizeForSearch("يزد"), normalizeForSearch("یزد"));
  assert.equal(normalizeForSearch("می‌خواهم"), normalizeForSearch("میخواهم"));
  assert.equal(normalizeForSearch("۱۲۳ ٤٥"), "123 45");
  const r = fuzzySearch("اصفهان", ["شیراز", "اسفهان", "اصفهان"]);
  assert.equal(r[0].text, "اصفهان");
  assert.equal(r[1].text, "اسفهان");
  assert.equal(r.length, 2);
});
test("persian sort", () => {
  assert.deepEqual(persianSort(["یزد", "تهران", "آمل", "ابهر", "پارس", "ب 10", "ب 9", "zed", "5"]), ["5", "ابهر", "آمل", "ب 9", "ب 10", "پارس", "تهران", "یزد", "zed"]);
  assert.deepEqual(persianSort(["ب", "الف"], "desc"), ["ب", "الف"]);
});
test("keyboard layout", () => {
  assert.equal(fixKeyboardLayout("sghl").converted, "سلام");
  assert.equal(fixKeyboardLayout("hg;l").converted, "الکم");
  assert.equal(fixKeyboardLayout("سلام").converted, "sghl");
  assert.equal(fixKeyboardLayout("سلام", "fa-to-en").direction, "fa-to-en");
});
test("legal id", () => {
  assert.equal(validateLegalId("10380284790").valid, true);
  assert.equal(validateLegalId("۱۰۳۸۰۲۸۴۷۹۰").valid, true);
  assert.equal(validateLegalId("11053639140").valid, false);
  assert.equal(validateLegalId("00000000000").valid, false);
  assert.equal(validateLegalId("123").valid, false);
});
test("csv safe", () => {
  const { csv, warnings } = toSafeCsv([["نام", "مبلغ"], ["علی, رضا", "۱٬۲۰۰٬۰۰۰"], ["=SUM(A1)", 5], ["0499370899", 'a"b']]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"علی, رضا",1200000'));
  assert.ok(csv.includes("'=SUM(A1),5"));
  assert.ok(csv.includes('"a""b"'));
  assert.ok(warnings.length >= 2);
});
test("fonts + provinces", () => {
  assert.ok(fontPresetCss("vazirmatn").css.includes("cdn.jsdelivr.net/npm/vazirmatn"));
  assert.equal(fontPresetCss("iransans").free, false);
  assert.throws(() => fontPresetCss("nope"));
  assert.equal(IRAN_PROVINCES.length, 31);
  assert.equal(new Set(IRAN_PROVINCES.map((p) => p.iso)).size, 31);
  assert.equal(findProvinces("فارس")[0].capitalFa, "شیراز");
  assert.equal(findProvinces("mashhad")[0].iso, "IR-09");
});
test("TOOLS.md is in sync with registered tools (run `npm run docs:tools`)", async () => {
  const current = readFileSync(new URL("../TOOLS.md", import.meta.url), "utf8");
  assert.equal(current, await buildToolsMarkdown());
});
