import { toAsciiDigits } from "./validators.js";

export interface Bank { fa: string; en: string }

const B = (fa: string, en: string): Bank => ({ fa, en });

// Card BINs (first 6 digits). Included only when several independent public lists agree.
const cardBins: Record<string, Bank> = {
  "603799": B("بانک ملی ایران", "Bank Melli Iran"),
  "589210": B("بانک سپه", "Bank Sepah"),
  "627648": B("بانک توسعه صادرات", "Export Development Bank of Iran"),
  "627961": B("بانک صنعت و معدن", "Bank of Industry and Mine"),
  "603770": B("بانک کشاورزی", "Bank Keshavarzi"),
  "628023": B("بانک مسکن", "Bank Maskan"),
  "627760": B("پست بانک ایران", "Post Bank of Iran"),
  "502908": B("بانک توسعه تعاون", "Tose'e Ta'avon Bank"),
  "627412": B("بانک اقتصاد نوین", "Eghtesad Novin Bank"),
  "622106": B("بانک پارسیان", "Parsian Bank"),
  "502229": B("بانک پاسارگاد", "Pasargad Bank"),
  "639599": B("بانک قوامین", "Ghavamin Bank"),
  "627488": B("بانک کارآفرین", "Karafarin Bank"),
  "621986": B("بانک سامان", "Saman Bank"),
  "639346": B("بانک سینا", "Sina Bank"),
  "639607": B("بانک سرمایه", "Sarmayeh Bank"),
  "504706": B("بانک شهر", "Shahr Bank"),
  "502806": B("بانک شهر", "Shahr Bank"),
  "502938": B("بانک دی", "Dey Bank"),
  "603769": B("بانک صادرات ایران", "Bank Saderat Iran"),
  "610433": B("بانک ملت", "Bank Mellat"),
  "627353": B("بانک تجارت", "Bank Tejarat"),
  "585983": B("بانک تجارت", "Bank Tejarat"),
  "589463": B("بانک رفاه کارگران", "Refah Bank"),
  "627381": B("بانک انصار", "Ansar Bank"),
  "507677": B("موسسه اعتباری نور", "Noor Credit Institution"),
  "628157": B("موسسه اعتباری توسعه", "Tose'e Credit Institution"),
  "505801": B("موسسه اعتباری کوثر", "Kosar Credit Institution"),
  "606256": B("موسسه اعتباری ملل", "Melal Credit Institution"),
  "606373": B("بانک قرض‌الحسنه مهر ایران", "Qarz al-Hasna Mehr Iran Bank"),
  "636214": B("بانک آینده", "Ayandeh Bank"),
  "504172": B("بانک قرض‌الحسنه رسالت", "Resalat Qarz al-Hasna Bank"),
  "505416": B("بانک گردشگری", "Tourism Bank"),
  "636949": B("بانک حکمت ایرانیان", "Hekmat Iranian Bank"),
};

// Bank code in Sheba: characters 5-7 of IRkk BBB ...
const shebaCodes: Record<string, Bank> = {
  "010": B("بانک مرکزی جمهوری اسلامی ایران", "Central Bank of Iran"),
  "011": B("بانک صنعت و معدن", "Bank of Industry and Mine"),
  "012": B("بانک ملت", "Bank Mellat"),
  "013": B("بانک رفاه کارگران", "Refah Bank"),
  "014": B("بانک مسکن", "Bank Maskan"),
  "015": B("بانک سپه", "Bank Sepah"),
  "016": B("بانک کشاورزی", "Bank Keshavarzi"),
  "017": B("بانک ملی ایران", "Bank Melli Iran"),
  "018": B("بانک تجارت", "Bank Tejarat"),
  "019": B("بانک صادرات ایران", "Bank Saderat Iran"),
  "020": B("بانک توسعه صادرات", "Export Development Bank of Iran"),
  "021": B("پست بانک ایران", "Post Bank of Iran"),
  "022": B("بانک توسعه تعاون", "Tose'e Ta'avon Bank"),
  "051": B("موسسه اعتباری توسعه", "Tose'e Credit Institution"),
  "052": B("بانک قوامین", "Ghavamin Bank"),
  "053": B("بانک کارآفرین", "Karafarin Bank"),
  "054": B("بانک پارسیان", "Parsian Bank"),
  "055": B("بانک اقتصاد نوین", "Eghtesad Novin Bank"),
  "056": B("بانک سامان", "Saman Bank"),
  "057": B("بانک پاسارگاد", "Pasargad Bank"),
  "058": B("بانک سرمایه", "Sarmayeh Bank"),
  "059": B("بانک سینا", "Sina Bank"),
  "060": B("بانک قرض‌الحسنه مهر ایران", "Qarz al-Hasna Mehr Iran Bank"),
  "061": B("بانک شهر", "Shahr Bank"),
  "062": B("بانک آینده", "Ayandeh Bank"),
  "063": B("بانک انصار", "Ansar Bank"),
  "064": B("بانک گردشگری", "Tourism Bank"),
  "065": B("بانک حکمت ایرانیان", "Hekmat Iranian Bank"),
  "066": B("بانک دی", "Dey Bank"),
  "069": B("بانک ایران زمین", "Iran Zamin Bank"),
  "070": B("بانک قرض‌الحسنه رسالت", "Resalat Qarz al-Hasna Bank"),
  "095": B("بانک ایران و ونزوئلا", "Iran-Venezuela Bank"),
};

export function bankFromCard(card: string): { bin: string; bank: Bank | null } {
  const d = toAsciiDigits(card).replace(/\D/g, "");
  if (d.length < 6) throw new Error("Need at least the first 6 digits of the card number");
  const bin = d.slice(0, 6);
  return { bin, bank: cardBins[bin] ?? null };
}

export function bankFromSheba(sheba: string): { code: string; bank: Bank | null } {
  const s = toAsciiDigits(sheba).toUpperCase().replace(/[\s-]/g, "");
  const m = /^(?:IR)?\d{2}(\d{3})/.exec(s);
  if (!m) throw new Error("Not a Sheba number");
  return { code: m[1], bank: shebaCodes[m[1]] ?? null };
}
