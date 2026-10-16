export interface Change { from: string; to: string; line: number }
export interface Issue { line: number; found: string; suggestion: string; kind: "css" | "tailwind" | "html" | "icon" | "layout" }

const sideMap: Record<string, string> = { left: "inline-start", right: "inline-end" };
const cornerMap: Record<string, string> = {
  "top-left": "start-start", "top-right": "start-end", "bottom-left": "end-start", "bottom-right": "end-end",
};

function lineOf(text: string, index: number) { return text.slice(0, index).split("\n").length; }

/** Convert physical CSS (and camelCase style objects) to logical properties. */
export function convertCss(css: string): { css: string; changes: Change[] } {
  const changes: Change[] = [];
  const rec = (from: string, to: string, offset: number, src: string) => { changes.push({ from, to, line: lineOf(src, offset) }); return to; };
  let out = css;
  const run = (re: RegExp, fn: (m: RegExpExecArray) => string) => {
    const src = out;
    out = src.replace(re, (...args) => {
      const m = args.slice(0, -2) as unknown as RegExpExecArray;
      const offset = args[args.length - 2] as number;
      const to = fn(m);
      return to === args[0] ? to : rec(args[0] as string, to, offset, src);
    });
  };
  // 4-value margin/padding shorthand (top right bottom left)
  run(/(?<![\w-])(margin|padding)\s*:\s*([^;{}()]+?)\s*(?=;|}|$)/gm, (m) => {
    const parts = m[2].trim().split(/\s+/);
    if (parts.length !== 4 || /!important/.test(m[2])) return m[0];
    const [t, r, b, l] = parts;
    const k = m[1];
    return t === b && l === r ? `${k}: ${t} ${r}` : `${k}-block: ${t} ${b}; ${k}-inline: ${l} ${r}`;
  });
  // border radius corners
  run(/(?<![\w-])border-(top|bottom)-(left|right)-radius/g, (m) => `border-${cornerMap[m[1] + "-" + m[2]]}-radius`);
  // margin/padding/border/scroll-* -left/-right
  run(/(?<![\w-])((?:scroll-)?(?:margin|padding)|border)-(left|right)(?![a-zA-Z])/g, (m) => `${m[1]}-${sideMap[m[2]]}`);
  run(/(?<![\w-])text-align\s*:\s*(left|right)/g, (m) => `text-align: ${m[1] === "left" ? "start" : "end"}`);
  run(/(?<![\w-])float\s*:\s*(left|right)/g, (m) => `float: ${sideMap[m[1]]}`);
  run(/(?<![\w-])clear\s*:\s*(left|right)/g, (m) => `clear: ${sideMap[m[1]]}`);
  run(/(?<![\w-])(left|right)(\s*:)/g, (m) => `inset-${sideMap[m[1]]}${m[2]}`);
  // camelCase style objects (React)
  run(/\b(margin|padding)(Left|Right)\b/g, (m) => `${m[1]}Inline${m[2] === "Left" ? "Start" : "End"}`);
  run(/\bborder(Left|Right)(Width|Color|Style)?\b/g, (m) => `borderInline${m[1] === "Left" ? "Start" : "End"}${m[2] ?? ""}`);
  run(/\bborder(Top|Bottom)(Left|Right)Radius\b/g, (m) => {
    const c = cornerMap[m[1].toLowerCase() + "-" + m[2].toLowerCase()].split("-");
    return `border${c[0][0].toUpperCase() + c[0].slice(1)}${c[1][0].toUpperCase() + c[1].slice(1)}Radius`;
  });
  run(/\btextAlign(\s*:\s*['"])(left|right)(['"])/g, (m) => `textAlign${m[1]}${m[2] === "left" ? "start" : "end"}${m[3]}`);
  return { css: out, changes };
}

const twRules: { re: RegExp; to: (m: RegExpExecArray) => string }[] = [
  { re: /^(-?)(ml|mr|pl|pr)-(.+)$/, to: (m) => `${m[1]}${m[2][0]}${m[2][1] === "l" ? "s" : "e"}-${m[3]}` },
  { re: /^(-?)(scroll-m|scroll-p)(l|r)-(.+)$/, to: (m) => `${m[1]}${m[2]}${m[3] === "l" ? "s" : "e"}-${m[4]}` },
  { re: /^(-?)(left|right)-(.+)$/, to: (m) => `${m[1]}${m[2] === "left" ? "start" : "end"}-${m[3]}` },
  { re: /^text-(left|right)$/, to: (m) => `text-${m[1] === "left" ? "start" : "end"}` },
  { re: /^float-(left|right)$/, to: (m) => `float-${m[1] === "left" ? "start" : "end"}` },
  { re: /^clear-(left|right)$/, to: (m) => `clear-${m[1] === "left" ? "start" : "end"}` },
  { re: /^border-(l|r)(-.+)?$/, to: (m) => `border-${m[1] === "l" ? "s" : "e"}${m[2] ?? ""}` },
  { re: /^rounded-(l|r)(-.+)?$/, to: (m) => `rounded-${m[1] === "l" ? "s" : "e"}${m[2] ?? ""}` },
  { re: /^rounded-(tl|tr|bl|br)(-.+)?$/, to: (m) => `rounded-${{ tl: "ss", tr: "se", bl: "es", br: "ee" }[m[1] as "tl"]}${m[2] ?? ""}` },
];

function convertUtility(u: string): string | null {
  const bang = u.startsWith("!") ? "!" : "";
  const core = bang ? u.slice(1) : u;
  for (const r of twRules) {
    const m = r.re.exec(core);
    if (m) return bang + r.to(m);
  }
  return null;
}

/** Convert Tailwind physical utilities (ml-4, pr-2, text-left, left-0, rounded-l...) to logical ones (ms-4, pe-2, text-start...). */
export function convertTailwind(text: string): { text: string; changes: Change[]; warnings: string[] } {
  const changes: Change[] = [];
  const out = text.replace(/[^\s"'`{}(),]+/g, (tok, offset: number) => {
    const i = tok.lastIndexOf(":");
    const variants = tok.slice(0, i + 1);
    const conv = convertUtility(tok.slice(i + 1));
    if (conv === null) return tok;
    const to = variants + conv;
    changes.push({ from: tok, to, line: lineOf(text, offset) });
    return to;
  });
  const warnings: string[] = [];
  if (/(^|[\s"'`:])-?space-x-/.test(text)) warnings.push("space-x-* is direction-sensitive; add rtl:space-x-reverse or use gap-*.");
  if (/translate-x-/.test(text)) warnings.push("translate-x-* does not flip in RTL; pair with rtl:-translate-x-* / rtl:translate-x-* variants.");
  return { text: out, changes, warnings };
}

export function auditRtl(text: string): { issues: Issue[]; summary: string } {
  const issues: Issue[] = [];
  for (const c of convertCss(text).changes) {
    if (c.from !== c.to) issues.push({ line: c.line, found: c.from.trim(), suggestion: c.to.trim(), kind: "css" });
  }
  for (const c of convertTailwind(text).changes) issues.push({ line: c.line, found: c.from, suggestion: c.to, kind: "tailwind" });
  const lines = text.split("\n");
  lines.forEach((ln, idx) => {
    const line = idx + 1;
    if (/<html\b/i.test(ln)) {
      if (!/\bdir\s*=\s*["']?rtl/i.test(ln)) issues.push({ line, found: "<html> without dir=\"rtl\"", suggestion: "<html lang=\"fa\" dir=\"rtl\">", kind: "html" });
      else if (!/\blang\s*=\s*["']?fa/i.test(ln)) issues.push({ line, found: "<html> without lang=\"fa\"", suggestion: "add lang=\"fa\"", kind: "html" });
    }
    if (/direction\s*:\s*ltr|dir\s*=\s*["']ltr["']/i.test(ln) && !/<(code|pre|bdi|input|a)\b/i.test(ln))
      issues.push({ line, found: "forced LTR", suggestion: "Only use LTR on small islands (code, emails, phone numbers); keep the page RTL.", kind: "layout" });
    if (/translateX\(|translate-x-/.test(ln)) issues.push({ line, found: "translateX / translate-x", suggestion: "Flip the sign in RTL (e.g. [dir=rtl] selector or rtl: variant).", kind: "layout" });
    if (/background-position\s*:[^;]*\b(left|right)\b|bg-(left|right)\b/.test(ln)) issues.push({ line, found: "background-position left/right", suggestion: "Mirror it under [dir=rtl] (physical positions do not flip).", kind: "layout" });
    if (/flex-row\b|flex-direction\s*:\s*row\b/.test(ln) && /(ltr|left|right)/i.test(ln)) issues.push({ line, found: "row direction mixed with physical hints", suggestion: "Flex rows flip automatically in RTL; remove manual reversal.", kind: "layout" });
    if (/(chevron|arrow|caret)[-_ ]?(right|left)|Chevron(Right|Left)|Arrow(Right|Left)/i.test(ln))
      issues.push({ line, found: "directional icon", suggestion: "Flip it in RTL (transform: scaleX(-1) under [dir=rtl], or Tailwind rtl:-scale-x-100).", kind: "icon" });
    if (/space-x-/.test(ln)) issues.push({ line, found: "space-x-*", suggestion: "Add rtl:space-x-reverse or use gap-*.", kind: "tailwind" });
  });
  issues.sort((a, b) => a.line - b.line);
  return { issues, summary: issues.length ? `${issues.length} RTL issue(s) found` : "No physical/LTR-only patterns found" };
}

