import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNationalId, validateCardNumber, validateSheba, normalizeMobile } from "../src/lib/validators.js";
import { numberToPersianWords, convertCurrency } from "../src/lib/money.js";
import { normalizePersian, toPersianDigits } from "../src/lib/text.js";
import { gregorianToJalali, jalaliToGregorian } from "../src/lib/jalali.js";

test("national id", () => {
  assert.equal(validateNationalId("0499370899"), true);
  assert.equal(validateNationalId("0499370898"), false);
  assert.equal(validateNationalId("1111111111"), false);
});
test("card number", () => {
  assert.equal(validateCardNumber("4111 1111 1111 1111"), true);
  assert.equal(validateCardNumber("1234"), false);
});
test("sheba rejects garbage", () => assert.equal(validateSheba("IR000000000000000000000000"), false));
test("mobile", () => {
  assert.equal(normalizeMobile("+98 912 345 6789"), "09123456789");
  assert.equal(normalizeMobile("12345"), null);
});
test("words", () => {
  assert.equal(numberToPersianWords(0), "صفر");
  assert.equal(numberToPersianWords(21), "بیست و یک");
  assert.equal(numberToPersianWords(1250), "یک هزار و دویست و پنجاه");
});
test("currency", () => assert.equal(convertCurrency(5, "toman", "rial"), 50));
test("text", () => {
  assert.equal(toPersianDigits("123"), "۱۲۳");
  assert.equal(normalizePersian("كتاب  ي"), "کتاب ی");
});
test("jalali round trip", () => {
  const j = gregorianToJalali(2024, 3, 20);
  assert.equal(j.formatted, "1403/01/01");
  assert.equal(jalaliToGregorian(1403, 1, 1).formatted, "2024-03-20");
});