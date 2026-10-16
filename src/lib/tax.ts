export interface VatResult { net: number; vat: number; gross: number; rate: number; mode: "exclusive" | "inclusive" }

/** VAT helper. mode "exclusive": amount excludes tax; "inclusive": amount already includes tax. Rate is in percent and must be given. */
export function calcVat(amount: number, ratePercent: number, mode: "exclusive" | "inclusive"): VatResult {
  if (!(amount >= 0) || !(ratePercent >= 0)) throw new Error("amount and rate must be non-negative numbers");
  const r = (x: number) => Math.round(x * 100) / 100;
  const k = ratePercent / 100;
  const net = mode === "exclusive" ? amount : amount / (1 + k);
  const gross = mode === "exclusive" ? amount * (1 + k) : amount;
  return { net: r(net), vat: r(gross - net), gross: r(gross), rate: ratePercent, mode };
}
