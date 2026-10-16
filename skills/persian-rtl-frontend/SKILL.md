---
name: persian-rtl-frontend
description: Use when building or editing any frontend, page, form, or component for Persian (Farsi) or other RTL users, including price and number inputs, Jalali dates, and Persian text.
---
# Persian RTL frontend

Build every UI for Persian users as RTL by default. Use the `parsi-mcp` tools instead of guessing.

## Always
- Set `<html lang="fa" dir="rtl">`. Never ship a Persian page as LTR.
- Use logical CSS (`margin-inline-start`, `padding-inline-end`, `text-align: start`, `inset-inline-*`) and Tailwind `ms-/me-/ps-/pe-/start-/end-`. Avoid `left`/`right`.
- Mirror directional icons, arrows, chevrons, carousels and progress bars. Keep phone numbers, emails, URLs and code as LTR islands.
- Use a Persian font such as Vazirmatn, and show Persian digits in the UI while submitting ASCII values.

## Use these parsi-mcp tools
- Start a page or project: `rtl_starter_snippet`, and load the `rtl-frontend-guidelines` prompt or `rtl_guidelines`.
- Review existing code: `rtl_audit_css`, then fix with `rtl_convert_css` and `rtl_convert_tailwind`.
- Price or numeric inputs: use `price_input_snippet` so digits group in threes while typing and the Persian words (for example "دویست هزار تومان") show live. Submit the raw number (`parse_grouped_number`).
- Dates: use Jalali via `gregorian_to_jalali`, `format_jalali_date`, `jalali_add`, `jalali_diff`. Store Gregorian or ISO in the backend.
- Text: clean with `sanitize_persian_text` and `normalize_persian_text`.
- Validation: `validate_national_id`, `validate_card_number`, `validate_sheba`, `validate_postal_code`, `normalize_mobile`.

## Before finishing
Check the page in RTL: layout flow, icon directions, input alignment, mixed English and number text, and form validation messages in Persian.
## More tools worth calling

- `jalali_month_grid` for date-picker UIs, `jalali_period_range` for report periods (week starts Saturday), `persian_relative_time` for "۳ روز پیش".
- `persian_sort` and `persian_fuzzy_search` for lists and search boxes (handles ي/ی, ك/ک, آ/ا and ZWNJ).
- `persian_font_preset` for Vazirmatn, Shabnam or Sahel CSS; `csv_export_safe` for Excel-friendly exports.
- `iran_provinces` for province dropdowns; `fix_keyboard_layout` when users type Persian on an English layout.
