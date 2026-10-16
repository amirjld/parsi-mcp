import { toAsciiDigits } from "./validators.js";

/** Persian-aware slug: keeps Persian/Latin letters and digits (ASCII), joins words with a separator. */
export function slugifyPersian(text: string, separator = "-"): string {
  const s = toAsciiDigits(text)
    .replace(/\u064A/g, "\u06CC").replace(/\u0649/g, "\u06CC").replace(/\u0643/g, "\u06A9")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[\u200C\u200D\u200E\u200F]/g, " ")
    .toLowerCase();
  const words = s.match(/[a-z0-9\u0621-\u063A\u0641-\u0647\u067E\u0686\u0698\u06A9\u06AF\u06CC]+/g) ?? [];
  return words.join(separator);
}

const L = "\u0622-\u06CC\u067E\u0686\u0698\u06AF\u06A9";
/** Fix common Persian typography: ZWNJ for "می/نمی" prefixes and plural/comparative suffixes, punctuation spacing and Persian punctuation marks. */
export function sanitizePersianText(input: string): string {
  let s = input
    .replace(/\u064A/g, "\u06CC").replace(/\u0649/g, "\u06CC").replace(/\u0643/g, "\u06A9")
    .replace(/[\u064B-\u0652\u0640]/g, "");
  s = s.replace(new RegExp(`(^|\\s)(ن?می) +(?=[${L}])`, "g"), "$1$2\u200C");
  s = s.replace(new RegExp(`(?<=[${L}]) +(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان|ترین|تری)(?![${L}])`, "g"), "\u200C$1");
  s = s.replace(/ +([,;?،؛؟!.:])/g, "$1");
  s = s.replace(new RegExp(`(?<=[${L}]),`, "g"), "،").replace(new RegExp(`(?<=[${L}]);`, "g"), "؛").replace(new RegExp(`(?<=[${L}])\\?`, "g"), "؟");
  s = s.replace(/ +([،؛؟!.:])/g, "$1");
  s = s.replace(new RegExp(`([،؛؟:])(?=[${L}])`, "g"), "$1 ");
  s = s.replace(/\u200C{2,}/g, "\u200C").replace(/\u200C(?=\s)|(?<=\s)\u200C/g, "").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

