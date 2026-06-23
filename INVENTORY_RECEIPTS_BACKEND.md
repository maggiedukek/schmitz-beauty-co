# Inventory + Receipts — backend contract (for the front-end)

This is what the backend gives the Inventory and Receipts tabs. The Baserow tables
and the two serverless functions are built and tested; the only thing left is two
Netlify environment variables (below) and wiring the front-end to these shapes.

## Netlify environment variables to add

| Variable | Value |
|---|---|
| `BASEROW_SUPPLIES_TABLE_ID` | `1041563`  (the Inventory table) |
| `BASEROW_EXPENSES_TABLE_ID` | `1041329`  (the Expenses table) |

(`BASEROW_TOKEN` is already set. These two are **not** secret — they're just table IDs.)

---

## Inventory  → `/.netlify/functions/supplies`

All requests send the dashboard password in the `x-dashboard-key` header (same as Requests).

**Two tracking modes per item:**
- `mode: "level"` — eyeballed. `full` is 100 and `remaining` is a percent (Full=100, ¾=75, ½=50, ¼=25, Empty=0). Used for glue, tape, most supplies.
- `mode: "amount"` — measured. `full` is a full container (e.g. 4 oz), `remaining` is the real amount left. Used for Danger Jones color — Brenna logs how much she used.

An item is **low** (turn it red) when `low: true`. That's `remaining <= alertAt`, or if no `alertAt` is set, when `percent <= 25` (a quarter).

### GET `/supplies` → list
```json
{ "count": 31, "lowCount": 2,
  "supplies": [
    { "id": 5, "name": "Masquerade Purple", "category": "Color",
      "mode": "amount", "unit": "oz", "full": 4, "remaining": 4,
      "alertAt": 0, "brand": "Danger Jones", "swatch": "#6A0DAD",
      "notes": "Semi-permanent vivid", "percent": 100, "low": false, "createdAt": null }
  ] }
```
Low items are sorted to the top. Use `swatch` to render a color chip for color items.

### PATCH `/supplies` → update one item (send the `id` + one intent)
- **Log usage** (a service used some): `{ "id": 5, "use": 1.5 }` → subtracts 1.5 from remaining.
- **Set the level** (the Full/¾/½/¼ buttons): `{ "id": 5, "remaining": 50 }`.
- **Restocked / refilled**: `{ "id": 5, "refill": true }` → remaining back to full.
- **Edit fields**: any of `name, category, mode, unit, full, alertAt, brand, swatch, notes`.
Returns `{ ok: true, supply: {…} }` with the recomputed `percent`/`low`.

### POST `/supplies` → add an item
```json
{ "name": "20 Volume Developer", "category": "Color", "mode": "amount",
  "unit": "oz", "full": 30.43, "remaining": 30.43, "brand": "Danger Jones" }
```
`remaining` defaults to `full`; `alertAt` defaults to a quarter of `full`.

**Pre-loaded:** the 20 Danger Jones semi-permanent vivids (each with a `swatch` hex),
the 5 developers (5/10/20/30/40 vol), Powder Lightener, and Color Remover — all
`mode:"amount"`, unit `oz`. Plus two `mode:"level"` examples (lash glue, lash tape).
Her **permanent (Epilogue) and demi toner** shades aren't pre-loaded — add the specific
ones she stocks via the “Add Item” form (or send me her list and I'll batch them).

---

## Receipts  → `/.netlify/functions/expenses`

### GET `/expenses` → list (newest first)
```json
{ "count": 2, "expenses": [
  { "id": 7, "vendor": "Sally Beauty", "amount": "42.50", "date": "2026-06-20",
    "category": "Supplies", "notes": "Lash trays", "receiptUrl": "https://…", "createdAt": null }
]}
```

### POST `/expenses` → add a receipt (optionally with a photo)
```json
{ "vendor": "Sally Beauty", "amount": 42.50, "date": "2026-06-20",
  "category": "Supplies", "notes": "Lash trays",
  "imageBase64": "data:image/jpeg;base64,…", "imageName": "receipt.jpg" }
```
If `imageBase64` is included, the photo is uploaded to Baserow and attached; the
response's `receiptUrl` is the stored image URL. Send the file as a base64 data URL.

---

## Notes
- These functions are **backend** — leave `supplies.js` and `expenses.js` to me so we
  don't both edit them. The Inventory/Receipts **front-end in `admin.html` is yours**.
- All numeric fields are stored as text in Baserow but the functions coerce them, so
  you never have to worry about types.
