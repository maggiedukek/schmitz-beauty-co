# Brenna's Dashboard — Build Plan

_Last updated: June 22, 2026_

Decisions: build **leads first**, capture receipts from **both phone and computer**, alert on
**low stock + expiration**, scheduling via **Fresha** + payments via **Square**, and use
**Baserow** as the single backend.

## Build status (as of June 22, 2026)

**Phase 1 (Leads) backend is built and tested.** Done so far:

- Baserow workspace + "Schmitz Beauty Co." database created, with three tables:
  `Leads`, `Supplies`, `Expenses` (the last with a photo/file field for receipts).
- A `Created` timestamp on every lead.
- Two serverless functions written and verified end-to-end against the live Baserow API:
  `submission-created.js` (auto-saves new form submissions) and `leads.js` (dashboard
  list + status updates).
- Dashboard (`admin.html`) rewired to Baserow — statuses now persist in the database and
  sync across devices (no more browser-only localStorage).

**What's left for Phase 1 to go live (your steps — I can't do these safely):**

1. In **Netlify → Environment variables**, add `BASEROW_TOKEN` (copy from Baserow →
   My settings → Database tokens → "Schmitz Dashboard") and `DASHBOARD_PASSWORD`.
2. Push these files to GitHub so Netlify redeploys.
3. Visit `/admin`, enter the password, and confirm a test booking shows up.

Phases 2 (receipts/taxes) and 3 (supplies alerts) come next — their tables already exist.

---

## 1. Where the project stands today

The folder `schmitz-beauty-co-web` is a plain HTML/CSS/JS site deployed on Netlify:

- `index.html` — public homepage with a consultation form.
- `book.html` — the consultation request page (a form, **not** an auto-booking calendar — which already matches Brenna's wish to do a consult first).
- `admin.html` — a password-gated dashboard at `/admin` that lists consultation requests.
- `netlify/functions/submissions.js` — one serverless function that reads form submissions from **Netlify Forms** using a secret token.

**What works:** the public form submits to Netlify Forms, and the dashboard can read those submissions behind a password. So lead *capture* is real.

**What's actually missing or fragile:**

- Lead **statuses** (New → Contacted → Booked → Closed) are stored only in the browser's `localStorage`. They don't sync between Brenna's phone and laptop, and they disappear if she clears her browser. This is the "not set up right" feeling.
- It only works once three secret values are configured in Netlify (auth token + dashboard password). This may not be done yet.
- **Products, receipts, and tax tracking do not exist** — no database, no image storage, no real login.
- **No Supabase is connected.** I searched the entire codebase: there is no Supabase URL, key, or client anywhere. If Brenna has a Supabase account, it's separate and not wired in. We'll need its project URL + keys to use it.

---

## 2. The architecture

One backend for everything: **Baserow** (free plan to start). _Chosen over Supabase, which
caps each account at 2 free projects — Maggie's agency account was already at that limit._

Baserow is a no-code database (think Airtable, but open-source). Three big wins here:
it has a **REST API** with permanent, per-table tokens; built-in **form views**; and
**file-attachment fields** so receipt photos attach right to a row. Brenna also gets a
friendly spreadsheet-style view of her own data.

- **Database:** Baserow tables — `Leads`, `Supplies`, `Expenses`.
- **Storage:** a file-attachment field on `Expenses` holds receipt photos (2GB free).
- **Login:** the dashboard stays password-gated; a small Netlify serverless function holds
  the secret Baserow token so it never reaches the browser. (This reuses the exact pattern
  already in `netlify/functions/submissions.js`.)

```
Public visitor → consultation form ─┐
                                    ├─→ Netlify function (holds secret token) ─→ Baserow
Brenna → /admin (password) ─────────┘                                              ▲
                                                                                   │
                            Dashboard reads/writes leads, supplies, expenses
                            through the function; statuses now persist for real
```

Free-plan limits to watch: 3,000 rows and 2GB storage per workspace. Both are comfortable
for a solo business for a long time; if receipts ever fill 2GB we move to a paid tier or
self-host (which removes limits).

**Info still needed before/while building:**

- A Baserow workspace + a database API token (we'll set this up).
- **Scheduling: Fresha. Payments: Square.** She books appointments in Fresha and takes
  card payments through Square. The dashboard links out to both; we don't rebuild either.
- Fresha has an API and **Zapier** integration, but the API is partner-oriented, not a
  simple open REST API for a solo business. **Zapier is the realistic way** to sync Fresha
  appointments into the dashboard if we want that later.

---

## 3. The four features

### A. Leads / consultation requests — _Phase 1, build first_

Finish what's started, on a real foundation.

- Move lead capture to a `Leads` table in Baserow (keep the consult-first flow — no auto-booking).
- Store status, notes, and contact attempts **in the database** so they sync across devices.
- Real login for the dashboard instead of one shared password.
- Keep the existing dashboard look (search, filters, status chips, stats).

### B. Supplies tracking with alerts — _Phase 3_

Note: Brenna does **not** sell retail products — that's the shop owner's business, and it's
out of scope. This feature tracks **her own professional supplies** (the products she uses
on clients) so she knows when to reorder or toss something.

- A `Supplies` table: name, quantity on hand, reorder threshold, expiration date, cost.
- **Low-stock alert** when quantity drops below the threshold she sets.
- **Expiration alert** when a supply is near or past its use-by date.
- Dashboard view: a clear list, with at-risk items flagged at the top.
- Optional later: a daily email/notification summarizing what needs attention.

### C. Receipts + tax tracking (sole proprietor) — _Phase 2_

- Capture **both** ways: snap a photo on her phone, or upload a file from a computer.
- Each receipt stores the image plus: date, vendor, amount, category, and a note.
- Photos attach to rows in an `Expenses` table (Baserow file field); details live in the same row.
- Year-end export to a spreadsheet (CSV/Excel) grouped by category for taxes.
- Mobile-first design so the phone capture is genuinely easy.

### D. Scheduling (Fresha) & payment (Square) — _connect, don't rebuild_

Brenna keeps her tools; we point to them and keep her in control.
**Fresha = appointments, Square = payments.**

- Booking stays **consult-first**: the form creates a lead; Brenna manually books the appointment in Fresha after the consult. No public self-booking from the website.
- Link out to her Fresha page for scheduling and to Square for payment, rather than rebuilding either.
- Optional later: use **Zapier** to copy new Fresha appointments into the dashboard, so it can show an "upcoming appointments" view alongside leads. Nice-to-have for Phase 4, not required.

---

## 4. Suggested order of work

1. **Phase 1 — Leads on Supabase.** Stand up Supabase, migrate leads, real login, statuses that sync. _This is the first thing Brenna will use daily._
2. **Phase 2 — Receipts + taxes.** Photo/file capture, expense records, year-end export.
3. **Phase 3 — Products.** Inventory with low-stock and expiration alerts.
4. **Phase 4 — Polish.** Scheduling/payment links, optional notifications, mobile refinements.

---

## 5. Cost

Baserow, Netlify, and the scheduling/payment tools she already uses all have free tiers
that comfortably cover one small business. We'd only consider paying if receipt photo
storage grows past Baserow's 2GB free limit (years of images) — and that's a small monthly
cost (or self-hosting), not an upfront one.

---

## 6. Open questions for you

_All resolved._ Backend = **Baserow** cloud (baserow.io), fresh workspace. Supplies tracking
= her own professional supplies (she sells no retail). **Scheduling = Fresha, payments =
Square.** Current notifications = Netlify Forms emails her each request (kept as backup).
