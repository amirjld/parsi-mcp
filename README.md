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