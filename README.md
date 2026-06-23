# Brenna's Dashboard — Setup

The site has a private dashboard at **`/admin`** (e.g. `https://your-site.netlify.app/admin`)
where Brenna reads the consultation requests submitted through the booking form.

**How it works.** Data lives in a **Baserow** database (the "Schmitz Beauty Co." database,
in the `Leads` table). Two small serverless functions handle everything, and the secret
Baserow token never touches the browser:

- `netlify/functions/submission-created.js` runs automatically whenever the booking form
  is submitted, and copies the request into Baserow. (Your existing Netlify email
  notification still fires too — this just adds the dashboard copy.)
- `netlify/functions/leads.js` powers the dashboard: it lists the leads and saves status
  changes back to Baserow. Because status now lives in the database, changes **sync across
  every device** Brenna uses — phone and laptop both stay in step.

To turn it on, set **two environment variables** in Netlify
(**Site configuration → Environment variables → Add a variable**):

| Variable | What to put |
|---|---|
| `BASEROW_TOKEN` | The Baserow database token. In Baserow: **avatar → My settings → Database tokens → "Schmitz Dashboard" → reveal/copy**. Keep it secret. |
| `DASHBOARD_PASSWORD` | The password Brenna will type to open the dashboard. Pick anything. |

*(Optional: `BASEROW_LEADS_TABLE_ID` — only needed if the Leads table ID ever changes. Defaults to `1041326`.)*

After adding the variables, trigger a redeploy (**Deploys → Trigger deploy**). Then visit
`https://your-site.netlify.app/admin`, enter the password, and the requests
appear. The page is marked `noindex`, so search engines won't list it — but
**share the link only with Brenna**, since the password is the only thing protecting it.

> Brenna can also see and edit the raw data anytime by logging into Baserow directly —
> handy for the `Supplies` and `Expenses` tables, which are set up and ready for the next
> phases (inventory alerts and receipt/tax tracking).

**Tracking requests.** Each request has a status — **New → Contacted → Booked → Closed**.
Brenna sets it from the dropdown on each card, and the chips at the top filter by status
(plus a "New / Unhandled" counter). Statuses save to Baserow instantly and sync everywhere.

## Receipts & expenses (the "Receipts" tab)

The dashboard's **Receipts** tab lets Brenna log business expenses and attach a photo of
each paper receipt (for taxes / write-offs). It's powered by `netlify/functions/expenses.js`
and the **`Expenses`** table in Baserow.

To turn it on, add one more environment variable:

| Variable | What to put |
|---|---|
| `BASEROW_EXPENSES_TABLE_ID` | The ID of the **Expenses** table in Baserow (open the table; the number is in the URL). |

The `Expenses` table needs these fields (exact names — the function maps to them):

| Field | Type |
|---|---|
| `Vendor` | Single line text |
| `Amount` | Number (2 decimal places) |
| `Date` | Date |
| `Category` | Single line text |
| `Notes` | Long text |
| `Receipt` | File |
| `Created` | Created on (auto) |

When Brenna adds a receipt with a photo, the function uploads the image to Baserow's file
storage and attaches it to the new row, so the receipt photo is saved with the expense.
She can also see/edit everything directly in Baserow.

## Inventory (the "Inventory" tab)

The **Inventory** tab tracks supplies on hand. Each item has a quantity with `+`/`−`
buttons, and a **reorder point** — when the quantity drops to or below it, the item turns
red and shows a **LOW** badge (with a "Low Stock" count in the stats). It's powered by
`netlify/functions/supplies.js` and the **`Supplies`** table in Baserow.

Add one more environment variable:

| Variable | What to put |
|---|---|
| `BASEROW_SUPPLIES_TABLE_ID` | The ID of the **Supplies** table in Baserow. |

The `Supplies` table needs these fields (exact names):

| Field | Type |
|---|---|
| `Item` | Single line text |
| `Category` | Single line text |
| `Quantity` | Number (whole number) |
| `Reorder At` | Number (whole number) |
| `Unit` | Single line text |
| `Notes` | Long text |
| `Created` | Created on (auto) |

---

# Schmitz Beauty Co. — Setup Guide

> ⚠️ The steps below were written for the older Expo version of this project and mention
> files like `App.js` and the `npx expo export` build. The site is now plain HTML/CSS/JS
> (`index.html`, `book.html`, `admin.html`, `styles.css`, `script.js`), and
> `netlify.toml` already has the correct build command. The GitHub + Netlify workflow
> in Steps 1–4 still applies.

This folder is your app. It's built with **Expo**, which means the same code runs as
a **website** (for Netlify, so Brenna can see it) *and* later as a real **iPhone/Android app**.

You don't need to know how to code to get it online. Just follow the steps below in order.

---

## Step 0 — Put all the files in one folder

Make a new folder on your computer called `schmitz-beauty-co` and put ALL of these
files inside it:

- `App.js` ............ the whole app (every screen, all the styling)
- `package.json` ...... the list of building blocks the app needs
- `app.json` .......... the app's name and settings
- `babel.config.js` ... a build helper (don't touch it)
- `netlify.toml` ...... tells Netlify how to put the site online
- `.gitignore` ........ ⚠️ this one arrives named `gitignore.txt` — **rename it to `.gitignore`** (a dot in front, no `.txt`)
- `README.md` ......... this guide

> Tip: to rename to `.gitignore` on Windows, right-click → Rename, type `.gitignore`,
> press Enter. If Windows complains, that's fine — confirm the change.

---

## Step 1 — Create a free GitHub account

GitHub is where your code lives online. Netlify reads from it.

1. Go to https://github.com and click **Sign up** (skip if you already have an account).
2. Once logged in, click the **+** in t