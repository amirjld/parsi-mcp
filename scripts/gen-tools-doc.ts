import { writeFileSync } from "node:fs";
import { buildToolsMarkdown } from "./tools-doc.js";

const md = await buildToolsMarkdown();
writeFileSync(new URL("../TOOLS.md", import.meta.url), md);
console.log("TOOLS.md written");
