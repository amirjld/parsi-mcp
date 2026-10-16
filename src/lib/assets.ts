import { readFileSync } from "node:fs";

const read = (rel: string) => readFileSync(new URL("../../" + rel, import.meta.url), "utf8");

export const rtlGuidelines = () => read("docs/rtl-frontend-guidelines.md");

export type Framework = "html" | "css" | "tailwind" | "nextjs" | "react" | "vue";
export function rtlStarterSnippet(framework: Framework): string {
  return read(`templates/rtl-${framework}.txt`);
}

export type PriceVariant = "react" | "vue" | "vanilla" | "core";
export function priceInputSnippet(variant: PriceVariant): string {
  if (variant === "core") return read("templates/price-core.ts.txt");
  return read(`templates/price-${variant}.txt`) + "\n\n/* Shared helpers: call price_input_snippet with variant \"core\" for persian-words.ts and price-format.ts */\n";
}
