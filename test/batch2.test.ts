import { test } from "node:test";
import assert from "node:assert/strict";
import { persianTextStats, detectTextDirection, truncatePersian, persianLorem } from "../src/lib/textutil.js";
import { formatShortNumber, decimalToPersianWords, formatIranPhone } from "../src/lib/numfmt.js";
import { jalaliAge, validateJalaliDate, isBusinessDay, addBusinessDays, countBusinessDays, fixedHolidays } from "../src/lib/dates2.js";
import { parseIranAddress } from "../src/lib/address.js";

test("text stats", () => {
  const s = persianTextStats("سلام دنیا. می‌خواهم بروم؟ hello 123\n\nدوم");
  assert.equal(s.words, 7);
  assert.equal(s.sentences, 3);
  assert.equal(s.paragraphs, 2);
  assert.equal(s.zwnj, 1);
  assert.equal(s.latinLetters, 5);
  assert.equal(s.digits, 3);
  const long = persianTextStats(Array(360).fill("کلمه").join(" "), 180);
  assert.equal(long.readingTime.seconds, 120);
  assert.equal(long.readingTime.text, "حدود ۲ دقیقه");
  assert.equal(persianTextStats("کلمه ".repeat(100), 100).readingTime.seconds, 60);
  assert.throws(() => persianTextStats("x", 0));
});
test("direction + bidi wrap", () => {
  assert.equal(detectTextDirection("سلام Ali").firstStrong, "rtl");
  assert.equal(detectTextDirection("Hello سلام").firstStrong, "ltr");
  assert.equal(detectTextDirection("123 !").dominant, "neutral");
  assert.equal(detectTextDirection("abc", "isolate").wrapped, "\u2068abc\u2069");
  assert.equal(detectTextDirection("a<b", "html-bdi").wrapped, "<bdi>a&lt;b</bdi>");
});
test("truncate", () => {
  const t = truncatePersian("این یک متن بسیار طولانی می‌خواهم برای آزمایش است", 22);
  assert.equal(t.text, "این یک متن بسیار…");
  assert.equal(truncatePersian("کوتاه", 20).truncated, false);
  const c = truncatePersian("می‌خواهم", 4, { mode: "char" }).text;
  assert.ok(!c.replace("…", "").endsWith("\u200C"));
  assert.equal(truncatePersian("😀😀😀😀", 3, { mode: "char" }).text, "😀😀…");
});
test("lorem deterministic", () => {
  assert.equal(persianLorem({ seed: 5 }), persianLorem({ seed: 5 }));
  assert.notEqual(persianLorem({ seed: 5 }), persianLorem({ seed: 6 }));
  assert.equal(persianLorem({ paragraphs: 3 }).split("\n\n").length, 3);
});
test("phone formats", () => {
  const m = formatIranPhone("+98 912 345 6789");
  assert.equal(m.national, "0912 345 6789");
  assert.equal(m.international, "+98 912 345 6789");
  assert.equal(m.e164, "+989123456789");
  assert.equal(formatIranPhone("۰۹۱۲۳۴۵۶۷۸۹", true).dashed, "۰۹۱۲-۳۴۵-۶۷۸۹");
  const l = formatIranPhone("02112345678");
  assert.equal(l.type, "landline");
  assert.equal(l.national, "021-12345678");
  assert.throws(() => formatIranPhone("123"));
});
test("short numbers", () => {
  assert.equal(formatShortNumber(2500000).text, "۲٫۵ میلیون");
  assert.equal(formatShortNumber(1200).text, "۱٫۲ هزار");
  assert.equal(formatShortNumber(999).text, "۹۹۹");
  assert.equal(formatShortNumber(999999).text, "۱ میلیون");
  assert.equal(formatShortNumber(3_400_000_000, { style: "latin" }).text, "3.4B");
  assert.equal(formatShortNumber(250000, { unit: "تومان" }).text, "۲۵۰ هزار تومان");
  assert.equal(formatShortNumber(-3400000).text, "−۳٫۴ میلیون");
});
test("decimal words", () => {
  assert.equal(decimalToPersianWords("12.5").words, "دوازده ممیز پنج دهم");
  assert.equal(decimalToPersianWords("0.05").words, "صفر ممیز پنج صدم");
  assert.equal(decimalToPersianWords("۱۲٫۵", "percent").words, "دوازده ممیز پنج دهم درصد");
  assert.equal(decimalToPersianWords("3/4", "fraction").words, "سه چهارم");
  assert.equal(decimalToPersianWords("1/2", "fraction", { halfAsNim: true }).words, "نیم");
  assert.equal(decimalToPersianWords("-2/3", "fraction").words, "منفی دو سوم");
  assert.throws(() => decimalToPersianWords("abc"));
  assert.throws(() => decimalToPersianWords("1/0", "fraction"));
});
test("age", () => {
  assert.deepEqual(
    (({ years, months, days }) => ({ years, months, days }))(jalaliAge({ year: 1380, month: 5, day: 20 }, { year: 1405, month: 7, day: 24 })),
    { years: 25, months: 2, days: 4 },
  );
  const b = jalaliAge({ year: 1400, month: 1, day: 31 }, { year: 1405, month: 2, day: 1 });
  assert.equal(`${b.years}/${b.months}/${b.days}`, "5/0/1");
  assert.equal(jalaliAge({ year: 1380, month: 7, day: 24 }, { year: 1405, month: 7, day: 24 }).isBirthdayToday, true);
  assert.throws(() => jalaliAge({ year: 1406, month: 1, day: 1 }, { year: 1405, month: 1, day: 1 }));
});
test("jalali validation", () => {
  assert.equal(validateJalaliDate({ year: 1403, month: 12, day: 30 }).valid, true);
  assert.equal(validateJalaliDate({ year: 1404, month: 12, day: 30 }).valid, false);
  assert.equal(validateJalaliDate({ year: 1405, month: 13, day: 1 }).valid, false);
  assert.equal(validateJalaliDate({ year: 1405, month: 7, day: 31 }).valid, false);
  const today = { year: 1405, month: 7, day: 24 };
  assert.equal(validateJalaliDate({ year: 1500, month: 1, day: 1 }, { notFuture: true, today }).errors[0], "date is in the future");
  assert.equal(validateJalaliDate({ year: 1300, month: 1, day: 1 }, { min: { year: 1320, month: 1, day: 1 } }).valid, false);
});
test("business days", () => {
  const fri = { year: 1405, month: 7, day: 24 }; // 2026-10-16 is a Friday
  assert.equal(isBusinessDay(fri), false);
  assert.equal(isBusinessDay({ year: 1405, month: 7, day: 23 }), true);
  assert.equal(isBusinessDay({ year: 1405, month: 7, day: 23 }, { weekend: "thursday_friday" }), false);
  assert.deepEqual(addBusinessDays(fri, 3), { year: 1405, month: 7, day: 27 });
  assert.deepEqual(addBusinessDays({ year: 1405, month: 7, day: 27 }, -3), { year: 1405, month: 7, day: 23 });
  assert.equal(countBusinessDays({ year: 1405, month: 7, day: 17 }, fri), 6);
  assert.equal(isBusinessDay({ year: 1405, month: 1, day: 2 }, { includeFixedSolarHolidays: true }), false);
  assert.equal(isBusinessDay({ year: 1405, month: 7, day: 25 }, { holidays: ["1405/07/25"] }), false);
});
test("holidays", () => {
  const h = fixedHolidays(1405);
  assert.equal(h.length, 10);
  assert.equal(h[0].gregorian, "2026-03-21");
  assert.equal(h[9].jalali, "1405/12/29");
});
test("address parse", () => {
  const a = parseIranAddress("تهران، خیابان ولیعصر، پلاک ۱۴، واحد ۳، طبقه ۲ کد پستی ۱۵۸۴۷۴۳۱۱۱");
  assert.equal(a.province?.iso, "IR-23");
  assert.equal(a.postalCode, "1584743111");
  assert.equal(a.plaque, "14");
  assert.equal(a.unit, "3");
  assert.equal(a.floor, "2");
  const b = parseIranAddress("خراسان رضوی مشهد بلوار وکیل آباد");
  assert.equal(b.province?.en, "Razavi Khorasan");
  assert.equal(b.city?.en, "Mashhad");
  assert.equal(parseIranAddress("شیراز").province?.en, "Fars");
  assert.equal(parseIranAddress("hello").province, null);
});
