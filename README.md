# parsi-mcp

**English** | [فارسی](README.fa.md)

An MCP server that gives AI agents (Claude, Cursor, VS Code Copilot and others) reliable Persian and Iran-specific tools. It runs fully offline, with no API keys: Jalali dates, Iranian validators, Persian text handling, grouped price inputs with Persian words, and an RTL frontend toolkit.

44 tools. See the full list in [TOOLS.md](TOOLS.md).

## Install

> Requires Node.js 18+. The `npx` commands below work once the package is published to npm; until then use [the local build](#from-source).

**Claude Code**

```bash
claude mcp add parsi -- npx -y parsi-mcp
```

Or install the plugin, which adds the MCP server and the `persian-rtl-frontend` skill:

```bash
claude plugin marketplace add amirjld/parsi-mcp
claude plugin install parsi@parsi-mcp
```

**Cursor** (`~/.cursor/mcp.json` or `.cursor/mcp.json` in a project)

```json
{ "mcpServers": { "parsi": { "command": "npx", "args": ["-y", "parsi-mcp"] } } }
```

**Claude Desktop** (`claude_desktop_config.json`: `%APPDATA%\Claude\` on Windows, `~/Library/Application Support/Claude/` on macOS)

```json
{ "mcpServers": { "parsi": { "command": "npx", "args": ["-y", "parsi-mcp"] } } }
```

**VS Code** (`.vscode/mcp.json`)

```json
{ "servers": { "parsi": { "type": "stdio", "command": "npx", "args": ["-y", "parsi-mcp"] } } }
```

**Agent skill** (tells agents to build Persian UIs RTL-first and to call these tools):

```bash
npx skills add amirjld/parsi-mcp
```

### From source

```bash
git clone https://github.com/amirjld/parsi-mcp.git
cd parsi-mcp && npm install && npm run build
# then use: { "command": "node", "args": ["/absolute/path/to/parsi-mcp/dist/index.js"] }
```

## Before and after

You ask: *"Build a checkout page in Persian with a price field."*

**Without parsi-mcp**, agents typically produce an LTR page with `margin-left` and `text-left`, a plain number box, and Latin digits.

**With parsi-mcp**, the agent loads the RTL guidelines, takes `rtl_starter_snippet` for the layout and `price_input_snippet` for the field, and validates payment fields with `validate_card_number` and `validate_sheba`:

```html
<html lang="fa" dir="rtl">
  <!-- price input: typing 200000 shows ۲۰۰٬۰۰۰ -->
  <input inputmode="numeric" value="۲۰۰٬۰۰۰" />
  <p aria-live="polite">دویست هزار تومان</p>
</html>
```

## What is inside

| Area | Highlights |
|---|---|
| Jalali calendar | convert, format, parse, add, diff, month grid for date pickers, week/month/quarter/year ranges, relative text (`۳ روز پیش`) |
| Iranian validators | national ID, legal-entity national ID, bank card, Sheba, mobile, postal code, bank and operator lookup |
| Persian text | normalization, ZWNJ fixes, digits, number and ordinal words, words to number, slugs, fuzzy search, Persian sort, keyboard-layout fix |
| Money | rial/toman, grouped digits, price in words, VAT helper, Excel-safe CSV export |
| RTL frontend | guidelines prompt/resource, CSS and Tailwind audit, converters to logical properties, starter snippets, price input snippets, Persian font presets |
| Data | 31 provinces with ISO 3166-2 codes and capitals |

## Data notes

Bank BINs, Sheba codes, mobile prefixes and province data only include entries confirmed by public sources. Holidays, plate parsing and national-ID city lookup are not included because reliable offline data could not be verified. The VAT helper needs you to supply the rate.

## Develop

```bash
npm install
npm run build
npm test
npm run docs:tools   # regenerate TOOLS.md (a test fails if it is out of date)
```

Each tool is a small pure function in `src/lib`, registered in `src/server.ts`. Contributions are welcome.

## Releasing

See the maintainer steps in [RELEASING.md](RELEASING.md).

## License

MIT
