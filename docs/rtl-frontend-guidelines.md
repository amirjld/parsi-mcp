# RTL frontend guidelines (Persian / Farsi)

Goal: every page, component and piece of text must be designed **right-to-left first**. AI-generated frontends default to LTR; never accept that for Persian UIs.

## 1. Document setup
- `<html lang="fa" dir="rtl">` (never leave `dir` off; `lang="fa"` also selects the right font shaping and spellcheck).
- Switch per locale instead of hard-coding when the app is multilingual: `dir = ["fa","ar","he","ur"].includes(lang) ? "rtl" : "ltr"`.
- Set `dir="rtl"` on portals/modals/popovers rendered outside the root (React portals, Radix, MUI) if they do not inherit.

## 2. Logical CSS (no left/right)
| Physical (avoid) | Logical (use) |
|---|---|
| `margin-left/right` | `margin-inline-start/end` |
| `padding-left/right` | `padding-inline-start/end` |
| `border-left/right` | `border-inline-start/end` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `text-align: left/right` | `text-align: start/end` |
| `float: left/right`, `clear` | `float: inline-start/inline-end` |
| `border-top-left-radius` | `border-start-start-radius` (top-right = `start-end`, bottom-left = `end-start`, bottom-right = `end-end`) |
| `margin: 0 8px 0 16px` | `margin-block: 0; margin-inline: 16px 8px` (shorthand values are physical: top right bottom left) |
Use `margin-inline`, `padding-inline`, `margin-block` for symmetrical cases. Use `gap` instead of margins between flex/grid children.

## 3. Things that do NOT flip automatically (flip them by hand)
- Directional icons: arrows, chevrons, "back"/"next", undo/redo, external-link, send. Use `[dir=rtl] .icon { transform: scaleX(-1) }` or Tailwind `rtl:-scale-x-100`. Do **not** flip: clocks, play buttons for media timelines, logos, checkmarks, plus/minus, phone, search, text-formatting icons, numbers.
- Progress bars and sliders: fill from the right. Use `direction: rtl` on the track or mirror `transform-origin`/`translateX` math.
- Carousels/swipers/steppers/breadcrumbs: first item on the right, "next" goes left. Give the container `dir="rtl"` and reverse swipe logic (Embla: `direction: "rtl"`).
- `transform: translateX()`, `background-position: left`, gradients (`to right`), box-shadow x offsets, `scroll-snap`, `scrollLeft` (negative in RTL in modern browsers), hard-coded animation directions (slide-in from left must become from the start side).
- Tooltips and dropdowns: position with `start`/`end` placements, not `left`/`right`.

## 4. Flexbox and grid
- `flex-direction: row` and `grid` columns already follow `dir`; the first child appears on the right. Do not add `row-reverse` to "fix" RTL.
- `justify-content: flex-start` means the right edge in RTL. `space-between` keeps order mirrored.
- Table columns: first column on the right; numeric columns align `text-align: end` with `dir="ltr"` cells or `font-variant-numeric: tabular-nums`.

## 5. Tailwind
- Use logical utilities (Tailwind 3.3+/4): `ms-*` `me-*` `ps-*` `pe-*` `start-*` `end-*` `text-start` `text-end` `border-s` `border-e` `rounded-s` `rounded-e` `rounded-ss/se/es/ee` `float-start` `scroll-ms-*`.
- Variants: `rtl:` and `ltr:` for direction-specific overrides (e.g. `rtl:-scale-x-100`, `rtl:space-x-reverse`, `rtl:translate-x-full`). Prefer `gap-*` over `space-x-*`.
- Never use `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right` for layout in RTL apps (use the `rtl_convert_tailwind` tool).
- `-translate-x-1/2` centering with `left-1/2` is symmetric only when both use the same side; prefer `start-1/2` plus `rtl:translate-x-1/2`, or use `inset-x-0 mx-auto`.

## 6. Bidirectional text (mixed Persian / English / numbers)
- Wrap user-generated or unknown-direction text in `<bdi>` or use `dir="auto"`; add `unicode-bidi: isolate`.
- LTR islands inside RTL text: emails, URLs, code, file paths, IDs, IBAN/Sheba, card numbers, phone numbers. Use `<span dir="ltr">` (or `<bdi dir="ltr">`) with `unicode-bidi: isolate`; for blocks `text-align: end` so they hug the RTL edge.
- Punctuation: use Persian marks (`،` `؛` `؟`). Parentheses and trailing punctuation next to English text can jump; wrap the English part in `<bdi>`.
- Inputs: `type="email"`, `url`, `tel`, numeric, password and code fields should be `dir="ltr"` (text aligned to end), while free-text fields use `dir="auto"` or inherit RTL. Placeholders follow the input direction.
- `<input dir="auto">` and `<textarea dir="auto">` let the text direction follow what the user types.

## 7. Fonts, line height and typography
- Fonts: Vazirmatn (SIL OFL, variable weight, supports Persian digits), also Estedad, Shabnam, Sahel, IRANSans (check license). Always include a system fallback.
- Next.js: `next/font/google` `Vazirmatn({ subsets: ["arabic","latin"] })`. Self-host for offline/blocked-network environments.
- Line height 1.7-2.0 for body text (Persian diacritics and tall letters clip at Latin line heights). Do not use negative letter-spacing: it breaks letter joining. Avoid `text-transform` and `font-style: italic` for Persian (no real italics).
- ZWNJ (U+200C, half-space): required for prefixes/suffixes: `می‌روم`, `نمی‌دانم`, `کتاب‌ها`, `بزرگ‌ترین`, `خانه‌ام`. Enter it in markup as `&zwnj;`. Use the `sanitize_persian_text` tool to fix text.
- Normalize Arabic `ي ك` to Persian `ی ک` before storing/searching (`normalize_persian_text`). Search must normalize both sides.
- Digits: show Persian digits (`۰۱۲۳۴۵۶۷۸۹`) in UI text (`to_persian_digits`), but keep ASCII digits in values you send to APIs, inputs of type number, and `inputMode="numeric"` fields (accept Persian/Arabic digits typed and normalize).
- Use `Intl.NumberFormat("fa-IR")` and `Intl.DateTimeFormat("fa-IR-u-ca-persian")` for display. Thousands separator in Persian is `٬` (U+066C), decimal is `٫`.

## 8. Prices and numeric inputs
- Group digits in 3s while typing (200000 -> `۲۰۰٬۰۰۰`), show the amount in words under the field (`دویست هزار تومان`), and support toman and rial (1 toman = 10 rial). Tools: `format_number_grouped`, `parse_grouped_number`, `price_to_persian_words`, `price_input_snippet`.
- Field requirements: `type="text"` with `inputMode="numeric"` (not `type="number"`, which cannot show separators), `dir="ltr"` with explicit `text-align: right` (so grouping stays stable and the number hugs the RTL edge), `autoComplete="off"`.
- Accept Persian, Arabic-Indic and ASCII digits typed or pasted; strip everything else; preserve the caret position by counting digits left of the caret before reformatting.
- Put the words in an `aria-live="polite"` element linked with `aria-describedby`.
- Submit the raw numeric value (ASCII digits, no separators) and the unit; never submit the formatted string. Validate on the server.
- Display unit labels (تومان/ریال) as text after the number; do not use currency symbols that reorder under bidi.

## 9. Calendars and dates
- Iranian users expect the Jalali (Solar Hijri) calendar: week starts Saturday, weekend Friday (Thursday often half-day), month names فروردین ... اسفند.
- Use a Jalali date picker (not `<input type="date">`, which shows Gregorian in most browsers) and store dates as ISO Gregorian (UTC) in the backend. Convert with `gregorian_to_jalali` / `jalali_to_gregorian`.
- Calendar grids start with Saturday on the right. Previous/next arrows are mirrored.

## 10. Forms, tables, charts
- Labels sit on the right of inputs in inline layouts; use `text-align: start`. Validation messages in Persian, aligned with the field.
- Icons inside inputs go on the `inset-inline-end` (search) / `inset-inline-start` side as the design needs; use logical padding so text does not overlap them.
- Tables: header cells `text-align: start`; sticky first column uses `inset-inline-start: 0`; horizontal scroll starts at the right edge.
- Charts: x-axis time flows right-to-left for Persian dashboards unless the product decides otherwise; mirror axes and legend, keep numerals Persian, keep tooltips RTL. Chart libraries need explicit RTL options (e.g. reverse axis / `rtl: true` where supported).
- Toasts, drawers and sidebars slide from the start side (right).

## 11. Frameworks
- **Next.js**: `<html lang="fa" dir="rtl">` in `app/layout.tsx`; `next/font` for Vazirmatn; with `next-intl` derive `dir` from the locale in the root layout; `generateStaticParams` for locales.
- **React**: set `document.documentElement.dir`; MUI `createTheme({ direction: "rtl" })` + RTL emotion cache (`stylis-plugin-rtl`); Radix `DirectionProvider`; Ant Design `ConfigProvider direction="rtl"`.
- **Vue**: `vue-i18n` locale watcher sets `lang`/`dir`; use logical CSS in scoped styles.
- Use `rtl_starter_snippet` for a ready base.

## 12. Common mistakes checklist
- [ ] `dir="rtl"` and `lang="fa"` on `<html>`
- [ ] No `margin-left/right`, `padding-left/right`, `left/right`, `text-align:left/right`, `float:left/right`, `ml-/mr-/pl-/pr-`, `text-left/right`
- [ ] Back/next arrows, chevrons, breadcrumbs separators mirrored
- [ ] Progress bars, sliders, carousels, steppers fill/advance from the right
- [ ] Emails, URLs, code, phone, card and Sheba numbers in LTR islands
- [ ] Mixed-direction text wrapped in `<bdi>` / `dir="auto"`
- [ ] Persian font with line-height >= 1.7, no negative letter-spacing
- [ ] ZWNJ used correctly; Arabic ي/ك normalized
- [ ] Persian digits in the UI, ASCII digits in values sent to the server
- [ ] Prices grouped by 3 with live Persian words; raw number submitted
- [ ] Jalali date picker, week starting Saturday
- [ ] Modals/portals/tooltips inherit RTL
- [ ] Verified visually in a real RTL browser at mobile and desktop widths
