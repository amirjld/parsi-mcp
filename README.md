# parsi-mcp

An MCP server that gives AI agents (Claude, Cursor, ChatGPT and others) reliable Iran-specific tools. It runs fully offline with no API keys.

## Tools

| Tool | What it does |
|---|---|
| `gregorian_to_jalali` / `jalali_to_gregorian` | Convert dates between calendars |
| `jalali_year_info` | Leap year and month length |
| `validate_national_id` | Code melli checksum |
| `validate_card_number` | 16-digit bank card (Luhn) |
| `validate_sheba` | Sheba / IBAN (mod 97) |
| `normalize_mobile` | Normalize Iranian mobile numbers |
| `normalize_persian_text` | Fix Arabic letter variants, spacing, digits |
| `to_persian_digits` | Convert digits to Persian digits |
| `number_to_persian_words` | Numbers in Persian words |
| `convert_rial_toman` | Rial and toman conversion |
| `bank_from_card` / `bank_from_sheba` | Bank name from card BIN or Sheba bank code |
| `mobile_operator` | MCI / Irancell / Rightel from a mobile number |
| `landline_province` | Province from a landline area code |
| `validate_postal_code` | 10-digit postal code rules |
| `persian_words_to_number` | "دویست و پنجاه هزار" to 250000 |
| `format_jalali_date` / `parse_jalali_date` | Format (tokens, Persian digits, weekday) and parse Jalali dates |
| `jalali_add` / `jalali_diff` | Add days, months, years; difference and Persian relative text |
| `slugify_persian` | URL slugs from Persian text |
| `sanitize_persian_text` | ZWNJ for می/نمی and plurals, Persian punctuation, spacing |
| `calculate_vat` | VAT exclusive or inclusive (you supply the rate) |
| `format_number_grouped` / `parse_grouped_number` | Thousands separators (`,` or `٬`), ASCII or Persian digits, and back |
| `price_to_persian_words` | `200000` toman to "دویست هزار تومان" (toman or rial) |
| `price_input_snippet` | React, Vue and vanilla price input: grouping while typing, caret kept, live Persian words, raw value submitted |
| `rtl_audit_css` | Find LTR-only CSS, HTML, JSX and Tailwind patterns |
| `rtl_convert_css` / `rtl_convert_tailwind` | Convert to logical properties and `ms-`/`me-`/`ps-`/`pe-` utilities |
| `rtl_starter_snippet` | RTL setup for html, css, tailwind, nextjs, react, vue |
| `rtl_guidelines` | RTL frontend guidelines (also the prompt and resource `rtl-frontend-guidelines`) |

## Why RTL support?

AI agents tend to build Persian frontends left-to-right: `margin-left`, `text-left`, un-mirrored arrows, broken numbers and English fragments inside Persian text. parsi-mcp ships a guidelines prompt/resource (`rtl-frontend-guidelines`, source in `docs/`), an auditor, converters from physical to logical CSS and Tailwind, and starter snippets, so an agent can load the rules first and check its own output afterwards. The price input generator covers a common case: digits grouped while typing, live Persian words, and the raw number submitted.

## Data notes

Bank BINs, Sheba codes, mobile prefixes and province codes only include entries confirmed by several public sources. Holidays, plate parsing and national-ID city lookup are not included because reliable offline data could not be verified.
## Use it

Build, then add it to your MCP client config:

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "parsi": { "command": "node", "args": ["/absolute/path/to/parsi-mcp/dist/index.js"] }
  }
}
```

## Develop

```bash
npm test
```

Each tool is a small pure function in `src/lib`, so adding one is easy. Contributions are welcome.

## License

MIT

## Agent skill

A ready-made skill lives in skills/persian-rtl-frontend/SKILL.md. Copy it into your agent's skills folder so it uses RTL and these tools by default when building Persian UIs.
