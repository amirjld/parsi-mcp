export interface FontPreset { id: string; family: string; license: string; free: boolean; cssImport?: string; npm?: string; source: string; note?: string }
export const FONT_PRESETS: Record<string, FontPreset> = {
  vazirmatn: { id: "vazirmatn", family: "Vazirmatn", license: "OFL-1.1", free: true, npm: "vazirmatn", cssImport: "https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css", source: "https://github.com/rastikerdar/vazirmatn", note: "Also on Google Fonts: https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap" },
  shabnam: { id: "shabnam", family: "Shabnam", license: "OFL-1.1", free: true, npm: "shabnam-font", cssImport: "https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css", source: "https://github.com/rastikerdar/shabnam-font" },
  sahel: { id: "sahel", family: "Sahel", license: "OFL-1.1", free: true, npm: "sahel-font", cssImport: "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v3.4.0/dist/font-face.css", source: "https://github.com/rastikerdar/sahel-font" },
  iransans: { id: "iransans", family: "IRANSans", license: "commercial (check the vendor license)", free: false, source: "https://fontiran.com", note: "Proprietary: no CDN or file is provided here. Self-host a licensed copy and declare @font-face yourself." },
};
const FALLBACK = "Tahoma, system-ui, -apple-system, 'Segoe UI', sans-serif";

export function fontPresetCss(id: string, opts: { selector?: string } = {}) {
  const p = FONT_PRESETS[id];
  if (!p) throw new Error(`Unknown font. Choose one of: ${Object.keys(FONT_PRESETS).join(", ")}`);
  const sel = opts.selector ?? "body";
  const stack = `"${p.family}", ${FALLBACK}`;
  const imports = p.cssImport ? `@import url("${p.cssImport}");\n\n` : "";
  const css = `${imports}:root { --font-fa: ${stack}; }\n\nhtml { direction: rtl; }\n${sel} {\n  font-family: var(--font-fa);\n  line-height: 1.8; /* Arabic-script text needs more leading than Latin */\n  letter-spacing: 0; /* never add letter-spacing to connected scripts */\n  text-align: start;\n}\ncode, pre, kbd, input[type="email"], input[type="url"] { font-family: ui-monospace, monospace; direction: ltr; text-align: left; }\n`;
  return { ...p, fontFamilyStack: stack, css, npmInstall: p.npm ? `npm i ${p.npm}` : undefined };
}
