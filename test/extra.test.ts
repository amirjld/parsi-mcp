import { test } from "node:test";
import assert from "node:assert/strict";
import { bankFromCard, bankFromSheba } from "../src/lib/banks.js";
import { mobileOperator, landlineProvince, validatePostalCode } from "../src/lib/phone.js";
import { calcVat } from "../src/lib/tax.js";
import { persianWordsToNumber } from "../src/lib/words.js";
import { formatNumberGrouped, parseGroupedNumber, priceToPersianWords } from "../src/lib/numbers.js";
import { formatJalali, parseJalali, addDaysJalali, addMonthsJalali, diffDaysJalali, relativeJalali } from "../src/lib/jalaliExtra.js";
import { slugifyPersian, sanitizePersianText } from "../src/lib/slug.js";
import { auditRtl, convertCss, convertTailwind } from "../src/lib/rtl.js";
import { rtlGuidelines, rtlStarterSnippet, priceInputSnippet } from "../src/lib/assets.js";

test("bank from card", () => {
  assert.equal(bankFromCard("6037-9912 3456 7890").bank?.en, "Bank Melli Iran");
  assert.equal(bankFromCard("610433").bank?.en, "Bank Mellat");
  assert.equal(bankFromCard("123456").bank, null);
  assert.throws(() => bankFromCard("123"));
});
test("bank from sheba", () => {
  assert.equal(bankFromSheba("IR130170000000123456789012").bank?.en, "Bank Melli Iran");
  assert.equal(bankFromSheba("ir 13 054 0000").bank?.en, "Parsian Bank");
  assert.equal(bankFromSheba("IR13999").bank, null);
  assert.throws(() => bankFromSheba("abc"));
});
test("mobile operator", () => {
  assert.equal(mobileOperator("09121234567")?.operator, "MCI");
  assert.equal(mobileOperator("+989351234567")?.operator, "Irancell");
  assert.equal(mobileOperator("09211234567")?.operator, "Rightel");
  assert.equal(mobileOperator("09401234567")?.operator, null);
  assert.equal(mobileOperator("123"), null);
});
test("landline province", () => {
  assert.equal(landlineProvince("021-12345678").province?.en, "Tehran");
  assert.equal(landlineProvince("+98 31 3123 4567").province?.en, "Isfahan");
  assert.equal(landlineProvince("۰۴۱۳۳۳۳۴۴۴۴").province?.en, "East Azerbaijan");
  assert.throws(() => landlineProvince("09121234567"));
});
test("postal code", () => {
  assert.equal(validatePostalCode("1619735744").valid, true);
  assert.equal(validatePostalCode("16197-35744").valid, true);
  assert.equal(validatePostalCode("0619735744").valid, false);
  assert.equal(validatePostalCode("1619725744").valid, false);
  assert.equal(validatePostalCode("1111311111").valid, false);
  assert.equal(validatePostalCode("12345").valid, false);
});
test("persian words to number", () => {
  assert.equal(persianWordsToNumber("دویست و پنجاه هزار"), 250000);
  assert.equal(persianWordsToNumber("یک میلیون و دویست هزار و سی و پنج"), 1200035);
  assert.equal(persianWordsToNumber("بیست و یک"), 21);
  assert.equal(persianWordsToNumber("منفی پنج"), -5);
  assert.equal(persianWordsToNumber("هزار"), 1000);
  assert.equal(persianWordsToNumber("صفر"), 0);
  assert.throws(() => persianWordsToNumber("سلام"));
});
test("round trip words", async () => {
  const { numberToPersianWords } = await import("../src/lib/money.js");
  for (const n of [1, 19, 20, 99, 100, 101, 1000, 12345, 1000000, 987654321]) assert.equal(persianWordsToNumber(numberToPersianWords(n)), n);
});
test("vat", () => {
  assert.deepEqual(calcVat(1000000, 10, "exclusive"), { net: 1000000, vat: 100000, gross: 1100000, rate: 10, mode: "exclusive" });
  assert.equal(calcVat(1100000, 10, "inclusive").net, 1000000);
  assert.throws(() => calcVat(-1, 10, "exclusive"));
});
test("grouped numbers", () => {
  assert.equal(formatNumberGrouped("200000"), "200,000");
  assert.equal(formatNumberGrouped(200000, { digits: "persian", separator: "٬" }), "۲۰۰٬۰۰۰");
  assert.equal(formatNumberGrouped("۱۲۳۴۵۶۷.۵"), "1,234,567.5");
  assert.equal(formatNumberGrouped("-1234"), "-1,234");
  assert.equal(formatNumberGrouped("abc"), "");
  assert.equal(formatNumberGrouped("000123"), "123");
  assert.deepEqual(parseGroupedNumber("۲۰۰٬۰۰۰"), { raw: "200000", value: 200000 });
  assert.deepEqual(parseGroupedNumber("1,234.5"), { raw: "1234.5", value: 1234.5 });
  assert.deepEqual(parseGroupedNumber("xyz"), { raw: "", value: null });
});
test("price words", () => {
  assert.equal(priceToPersianWords("200000", "toman"), "دویست هزار تومان");
  assert.equal(priceToPersianWords("۲۰۰٬۰۰۰", "rial"), "دویست هزار ریال");
  assert.equal(priceToPersianWords("0.5", "toman"), "پنج ریال");
  assert.equal(priceToPersianWords("2.5", "toman"), "دو تومان و پنج ریال");
  assert.equal(priceToPersianWords("0"), "صفر تومان");
  assert.throws(() => priceToPersianWords("1.5", "rial"));
  assert.throws(() => priceToPersianWords("abc"));
});
test("jalali format/parse/add/diff", () => {
  const d = { year: 1403, month: 5, day: 9 };
  assert.equal(formatJalali(d, "dddd D MMMM YYYY"), "سه\u200Cشنبه 9 مرداد 1403");
  assert.equal(formatJalali(d, "YYYY/MM/DD", true), "۱۴۰۳/۰۵/۰۹");
  assert.deepEqual(parseJalali("۱۴۰۳-۵-۹"), d);
  assert.deepEqual(parseJalali("9 مرداد 1403"), d);
  assert.throws(() => parseJalali("1403/13/01"));
  assert.deepEqual(addDaysJalali({ year: 1403, month: 12, day: 29 }, 2), { year: 1404, month: 1, day: 1 });
  assert.deepEqual(addMonthsJalali({ year: 1403, month: 1, day: 31 }, -1), { year: 1402, month: 12, day: 29 });
  assert.deepEqual(addMonthsJalali({ year: 1403, month: 6, day: 31 }, 6), { year: 1403, month: 12, day: 30 });
  assert.equal(diffDaysJalali({ year: 1403, month: 1, day: 1 }, { year: 1404, month: 1, day: 1 }), 366);
  assert.equal(relativeJalali(d, addDaysJalali(d, 3)).text, "۳ روز بعد");
  assert.equal(relativeJalali(d, addDaysJalali(d, -1)).text, "دیروز");
});
test("slug and sanitize", () => {
  assert.equal(slugifyPersian("سلام، دنیای   من! Hello World ۱۲۳"), "سلام-دنیای-من-hello-world-123");
  assert.equal(sanitizePersianText("او می رود و کتاب ها را نمی دانم"), "او می\u200Cرود و کتاب\u200Cها را نمی\u200Cدانم");
  assert.equal(sanitizePersianText("سلام , خوبی ?"), "سلام، خوبی؟");
  assert.equal(sanitizePersianText("كتاب  ياد"), "کتاب یاد");
});
test("rtl convert css", () => {
  const r = convertCss(".a{margin-left:10px;text-align:left;float:right;left:0;border-left-width:2px}");
  assert.equal(r.css, ".a{margin-inline-start:10px;text-align: start;float: inline-end;inset-inline-start:0;border-inline-start-width:2px}");
  assert.equal(convertCss("margin: 1px 2px 3px 4px").css, "margin-block: 1px 3px; margin-inline: 4px 2px");
  assert.equal(convertCss("padding: 1px 2px 1px 2px").css, "padding: 1px 2px");
  assert.equal(convertCss("border-top-left-radius: 4px").css, "border-start-start-radius: 4px");
  assert.equal(convertCss("{ marginLeft: 4, textAlign: 'left' }").css, "{ marginInlineStart: 4, textAlign: 'start' }");
  assert.equal(convertCss("margin: 0 auto").changes.length, 0);
});
test("rtl convert tailwind", () => {
  const r = convertTailwind('className="ml-4 md:pr-2 -mr-1 text-left left-0 rounded-tl-lg border-l-2 !pl-3 hover:rounded-r flex"');
  assert.equal(r.text, 'className="ms-4 md:pe-2 -me-1 text-start start-0 rounded-ss-lg border-s-2 !ps-3 hover:rounded-e flex"');
  assert.equal(r.changes.length, 9);
  assert.ok(convertTailwind("space-x-4").warnings.length > 0);
});
test("rtl audit", () => {
  const a = auditRtl('<html lang="en">\n<div class="ml-4 text-left"></div>\n<style>.x{float:left}</style>\n<ChevronRight />');
  const kinds = a.issues.map((i) => i.kind);
  assert.ok(kinds.includes("html") && kinds.includes("tailwind") && kinds.includes("css") && kinds.includes("icon"));
  assert.equal(auditRtl('<html lang="fa" dir="rtl"><div class="ms-4"></div>').issues.length, 0);
});
test("assets", () => {
  assert.match(rtlGuidelines(), /dir="rtl"/);
  for (const f of ["html", "css", "tailwind", "nextjs", "react", "vue"] as const) assert.ok(rtlStarterSnippet(f).length > 50);
  for (const v of ["react", "vue", "vanilla", "core"] as const) assert.ok(priceInputSnippet(v).includes("aria-live") || v === "core");
  assert.match(priceInputSnippet("react"), /inputMode="numeric"/);
  assert.match(rtlGuidelines(), /price_to_persian_words/);
});

