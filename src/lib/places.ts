import { normalizeForSearch } from "./search.js";

export interface Province { iso: string; fa: string; en: string; capitalFa: string; capitalEn: string }
// 31 provinces. ISO 3166-2:IR codes (current, post-2020 renumbering) and names verified against Wikipedia's ISO 3166-2:IR table; capitals are well-established.
export const IRAN_PROVINCES: Province[] = [
  { iso: "IR-30", fa: "البرز", en: "Alborz", capitalFa: "کرج", capitalEn: "Karaj" },
  { iso: "IR-24", fa: "اردبیل", en: "Ardabil", capitalFa: "اردبیل", capitalEn: "Ardabil" },
  { iso: "IR-04", fa: "آذربایجان غربی", en: "West Azerbaijan", capitalFa: "ارومیه", capitalEn: "Urmia" },
  { iso: "IR-03", fa: "آذربایجان شرقی", en: "East Azerbaijan", capitalFa: "تبریز", capitalEn: "Tabriz" },
  { iso: "IR-18", fa: "بوشهر", en: "Bushehr", capitalFa: "بوشهر", capitalEn: "Bushehr" },
  { iso: "IR-14", fa: "چهارمحال و بختیاری", en: "Chaharmahal and Bakhtiari", capitalFa: "شهرکرد", capitalEn: "Shahrekord" },
  { iso: "IR-10", fa: "اصفهان", en: "Isfahan", capitalFa: "اصفهان", capitalEn: "Isfahan" },
  { iso: "IR-07", fa: "فارس", en: "Fars", capitalFa: "شیراز", capitalEn: "Shiraz" },
  { iso: "IR-01", fa: "گیلان", en: "Gilan", capitalFa: "رشت", capitalEn: "Rasht" },
  { iso: "IR-27", fa: "گلستان", en: "Golestan", capitalFa: "گرگان", capitalEn: "Gorgan" },
  { iso: "IR-13", fa: "همدان", en: "Hamadan", capitalFa: "همدان", capitalEn: "Hamadan" },
  { iso: "IR-22", fa: "هرمزگان", en: "Hormozgan", capitalFa: "بندرعباس", capitalEn: "Bandar Abbas" },
  { iso: "IR-16", fa: "ایلام", en: "Ilam", capitalFa: "ایلام", capitalEn: "Ilam" },
  { iso: "IR-08", fa: "کرمان", en: "Kerman", capitalFa: "کرمان", capitalEn: "Kerman" },
  { iso: "IR-05", fa: "کرمانشاه", en: "Kermanshah", capitalFa: "کرمانشاه", capitalEn: "Kermanshah" },
  { iso: "IR-29", fa: "خراسان جنوبی", en: "South Khorasan", capitalFa: "بیرجند", capitalEn: "Birjand" },
  { iso: "IR-09", fa: "خراسان رضوی", en: "Razavi Khorasan", capitalFa: "مشهد", capitalEn: "Mashhad" },
  { iso: "IR-28", fa: "خراسان شمالی", en: "North Khorasan", capitalFa: "بجنورد", capitalEn: "Bojnord" },
  { iso: "IR-06", fa: "خوزستان", en: "Khuzestan", capitalFa: "اهواز", capitalEn: "Ahvaz" },
  { iso: "IR-17", fa: "کهگیلویه و بویراحمد", en: "Kohgiluyeh and Boyer-Ahmad", capitalFa: "یاسوج", capitalEn: "Yasuj" },
  { iso: "IR-12", fa: "کردستان", en: "Kurdistan", capitalFa: "سنندج", capitalEn: "Sanandaj" },
  { iso: "IR-15", fa: "لرستان", en: "Lorestan", capitalFa: "خرم‌آباد", capitalEn: "Khorramabad" },
  { iso: "IR-00", fa: "مرکزی", en: "Markazi", capitalFa: "اراک", capitalEn: "Arak" },
  { iso: "IR-02", fa: "مازندران", en: "Mazandaran", capitalFa: "ساری", capitalEn: "Sari" },
  { iso: "IR-26", fa: "قزوین", en: "Qazvin", capitalFa: "قزوین", capitalEn: "Qazvin" },
  { iso: "IR-25", fa: "قم", en: "Qom", capitalFa: "قم", capitalEn: "Qom" },
  { iso: "IR-20", fa: "سمنان", en: "Semnan", capitalFa: "سمنان", capitalEn: "Semnan" },
  { iso: "IR-11", fa: "سیستان و بلوچستان", en: "Sistan and Baluchestan", capitalFa: "زاهدان", capitalEn: "Zahedan" },
  { iso: "IR-23", fa: "تهران", en: "Tehran", capitalFa: "تهران", capitalEn: "Tehran" },
  { iso: "IR-21", fa: "یزد", en: "Yazd", capitalFa: "یزد", capitalEn: "Yazd" },
  { iso: "IR-19", fa: "زنجان", en: "Zanjan", capitalFa: "زنجان", capitalEn: "Zanjan" },
];

export function findProvinces(query?: string): Province[] {
  if (!query?.trim()) return IRAN_PROVINCES;
  const q = normalizeForSearch(query);
  return IRAN_PROVINCES.filter((p) => [p.fa, p.en, p.capitalFa, p.capitalEn, p.iso].some((v) => normalizeForSearch(v).includes(q)));
}
